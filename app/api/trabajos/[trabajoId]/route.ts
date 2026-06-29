import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { getAuthenticatedUser, checkAccess } from '@/lib/auth/middleware';
import { FieldValue } from 'firebase-admin/firestore';

// GET: Fetch work details
export async function GET(
  request: NextRequest,
  { params }: { params: { trabajoId: string } }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { trabajoId } = params;

  try {
    const doc = await adminFirestore.collection('trabajos').doc(trabajoId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    }

    const trabajo = doc.data();
    if (!trabajo) {
      return NextResponse.json({ error: 'Datos de trabajo inválidos' }, { status: 404 });
    }

    // Verify access
    if (!checkAccess(user, trabajo.clienteId)) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    return NextResponse.json({ id: doc.id, ...trabajo });
  } catch (error) {
    console.error('Error fetching work info:', error);
    return NextResponse.json({ error: 'Error al obtener información de trabajo' }, { status: 500 });
  }
}

// PATCH: Update work state (aprobado, rechazado, en_modificacion)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { trabajoId: string } }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { trabajoId } = params;

  try {
    const body = await request.json();
    const { estado } = body;

    if (!estado || !['aprobado', 'rechazado', 'en_modificacion', 'en_revision'].includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const docRef = adminFirestore.collection('trabajos').doc(trabajoId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    }

    const trabajo = doc.data();
    if (!trabajo) {
      return NextResponse.json({ error: 'Datos de trabajo inválidos' }, { status: 404 });
    }

    // Verify access
    if (!checkAccess(user, trabajo.clienteId)) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    // Clients cannot change approved works back to review unless authorized,
    // but they can always approve, reject or ask for modifications on revision.
    const updates = {
      estado,
      actualizadoEn: FieldValue.serverTimestamp(),
    };

    await docRef.update(updates);

    return NextResponse.json({ success: true, updates });
  } catch (error) {
    console.error('Error updating work status:', error);
    return NextResponse.json({ error: 'Error al actualizar estado del trabajo' }, { status: 500 });
  }
}
