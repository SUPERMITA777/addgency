import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { getAuthenticatedUser, checkAccess } from '@/lib/auth/middleware';
import { Timestamp } from 'firebase-admin/firestore';

// GET: Fetch detailed client info
export async function GET(
  request: NextRequest,
  { params }: { params: { clienteId: string } }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { clienteId } = params;

  if (!checkAccess(user, clienteId)) {
    return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
  }

  try {
    const doc = await adminFirestore.collection('clientes').doc(clienteId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const data = doc.data();
    if (data && !data.activo && user.rol !== 'admin') {
      return NextResponse.json({ error: 'Cliente inactivo' }, { status: 403 });
    }

    return NextResponse.json({ id: doc.id, ...data });
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json({ error: 'Error al obtener los detalles del cliente' }, { status: 500 });
  }
}

// PATCH/PUT: Update client fields (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { clienteId: string } }
) {
  const user = await getAuthenticatedUser(request);
  if (!user || user.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado - Requiere rol Admin' }, { status: 401 });
  }

  const { clienteId } = params;

  try {
    const body = await request.json();
    const { nombre, email, empresa, planActual, planEstado, planFechaVencimiento } = body;

    const docRef = adminFirestore.collection('clientes').doc(clienteId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (nombre) updates.nombre = nombre;
    if (email) updates.email = email;
    if (empresa) updates.empresa = empresa;
    if (planActual) updates.planActual = planActual;
    if (planEstado) updates.planEstado = planEstado;
    if (planFechaVencimiento) {
      updates.planFechaVencimiento = Timestamp.fromDate(new Date(planFechaVencimiento));
    }

    await docRef.update(updates);

    return NextResponse.json({ success: true, updates });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Error al actualizar el cliente' }, { status: 500 });
  }
}

// DELETE: Deactivate client soft delete (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { clienteId: string } }
) {
  const user = await getAuthenticatedUser(request);
  if (!user || user.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado - Requiere rol Admin' }, { status: 401 });
  }

  const { clienteId } = params;

  try {
    const docRef = adminFirestore.collection('clientes').doc(clienteId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Soft delete
    await docRef.update({ activo: false });

    return NextResponse.json({ success: true, message: 'Cliente desactivado correctamente' });
  } catch (error) {
    console.error('Error deactivating client:', error);
    return NextResponse.json({ error: 'Error al desactivar el cliente' }, { status: 500 });
  }
}
