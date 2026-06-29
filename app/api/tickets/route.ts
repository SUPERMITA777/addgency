import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { FieldValue } from 'firebase-admin/firestore';

// GET tickets: Admin can see all, clients can only see their own
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetClienteId = searchParams.get('clienteId');

  try {
    let query: FirebaseFirestore.Query = adminFirestore.collection('tickets');

    if (user.rol === 'admin') {
      if (targetClienteId) {
        query = query.where('clienteId', '==', targetClienteId);
      }
    } else {
      // Clients can only fetch their own tickets
      query = query.where('clienteId', '==', user.clienteId);
    }

    const snapshot = await query.get();
    const tickets = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort in memory to avoid index requirements
    tickets.sort((a: any, b: any) => {
      const aTime = a.creadoEn?.toMillis ? a.creadoEn.toMillis() : 0;
      const bTime = b.creadoEn?.toMillis ? b.creadoEn.toMillis() : 0;
      return bTime - aTime;
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Error al obtener tickets' }, { status: 500 });
  }
}

// POST tickets: Clients can create tickets, admins can reply/resolve or also create
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clienteId, trabajoId, tipo, mensaje, respuesta, estado } = body;

    // Validate request
    if (user.rol === 'cliente' && clienteId && clienteId !== user.clienteId) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    const finalClienteId = user.rol === 'admin' ? clienteId : user.clienteId;
    if (!finalClienteId || !tipo || !mensaje) {
      return NextResponse.json({ error: 'Faltan campos requeridos (clienteId, tipo, mensaje)' }, { status: 400 });
    }

    const newTicket = {
      clienteId: finalClienteId,
      trabajoId: trabajoId || null,
      tipo,
      estado: estado || 'abierto',
      mensaje,
      respuesta: respuesta || null,
      creadoEn: FieldValue.serverTimestamp(),
      creadoPor: user.rol,
      ...(respuesta ? { respondidoEn: FieldValue.serverTimestamp() } : {}),
    };

    const docRef = await adminFirestore.collection('tickets').add(newTicket);

    return NextResponse.json(
      { id: docRef.id, ...newTicket },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Error al procesar ticket' }, { status: 500 });
  }
}

// PUT / PATCH: For replying to or updating tickets
export async function PUT(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ticketId, respuesta, estado } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'Identificador de ticket requerido' }, { status: 400 });
    }

    const docRef = adminFirestore.collection('tickets').doc(ticketId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    const ticket = doc.data();

    // Verify permission
    if (user.rol === 'cliente' && ticket?.clienteId !== user.clienteId) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};

    if (estado) {
      updates.estado = estado;
    }

    if (respuesta !== undefined) {
      updates.respuesta = respuesta;
      updates.respondidoEn = FieldValue.serverTimestamp();
    }

    await docRef.update(updates);

    return NextResponse.json({ success: true, updates });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Error al actualizar ticket' }, { status: 500 });
  }
}
