import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// GET: List all clients (Admin only)
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || user.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado - Requiere rol Admin' }, { status: 401 });
  }

  try {
    const snapshot = await adminFirestore
      .collection('clientes')
      .where('activo', '==', true)
      .get();

    const clientes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort in memory to avoid Firestore composite index requirement
    clientes.sort((a: any, b: any) => {
      const aTime = a.creadoEn?.toMillis ? a.creadoEn.toMillis() : 0;
      const bTime = b.creadoEn?.toMillis ? b.creadoEn.toMillis() : 0;
      return bTime - aTime;
    });

    return NextResponse.json(clientes);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Error al obtener los clientes' }, { status: 500 });
  }
}

// POST: Create a new client (Admin only)
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || user.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado - Requiere rol Admin' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nombre, email, empresa, subdominio, planActual, planFechaVencimiento } = body;

    if (!nombre || !email || !empresa || !subdominio) {
      return NextResponse.json({ error: 'Campos requeridos faltantes (nombre, email, empresa, subdominio)' }, { status: 400 });
    }

    // Verify subdominio uniqueness
    const dupCheck = await adminFirestore
      .collection('clientes')
      .where('subdominio', '==', subdominio)
      .limit(1)
      .get();

    if (!dupCheck.empty) {
      return NextResponse.json({ error: 'El subdominio ya está registrado por otro cliente' }, { status: 409 });
    }

    const planExpiry = planFechaVencimiento ? new Date(planFechaVencimiento) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // default 30 days

    const newCliente = {
      nombre,
      email,
      empresa,
      subdominio: subdominio.toLowerCase().trim(),
      planActual: planActual || 'Básico',
      planEstado: 'vigente',
      planFechaVencimiento: Timestamp.fromDate(planExpiry),
      creadoEn: FieldValue.serverTimestamp(),
      activo: true,
    };

    const docRef = await adminFirestore.collection('clientes').add(newCliente);

    return NextResponse.json({ id: docRef.id, ...newCliente, planFechaVencimiento: planExpiry.toISOString() }, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Error al crear el cliente' }, { status: 500 });
  }
}
