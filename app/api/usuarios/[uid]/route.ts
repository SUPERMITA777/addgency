import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase/admin';
import { getAuthenticatedUser } from '@/lib/auth/middleware';

// POST/PUT: Update user role and custom claims (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  const adminUser = await getAuthenticatedUser(request);
  if (!adminUser || adminUser.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado - Requiere rol Admin' }, { status: 401 });
  }

  const { uid } = params;

  try {
    const body = await request.json();
    const { rol, clienteId } = body;

    if (!rol || !['admin', 'cliente'].includes(rol)) {
      return NextResponse.json({ error: 'Rol inválido o faltante' }, { status: 400 });
    }

    if (rol === 'cliente' && !clienteId) {
      return NextResponse.json({ error: 'Falta clienteId para rol cliente' }, { status: 400 });
    }

    const cleanedClienteId = rol === 'cliente' ? clienteId : '';

    // 1. Update Firestore user document
    await adminFirestore.collection('usuarios').doc(uid).update({
      rol,
      clienteId: cleanedClienteId,
    });

    // 2. Set Custom User Claims in Firebase Auth
    await adminAuth.setCustomUserClaims(uid, {
      rol,
      clienteId: cleanedClienteId,
    });

    return NextResponse.json({ success: true, rol, clienteId: cleanedClienteId });
  } catch (error: any) {
    console.error('Error updating user role and claims:', error);
    return NextResponse.json({ error: error.message || 'Error al actualizar el usuario' }, { status: 500 });
  }
}
