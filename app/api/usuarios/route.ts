import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase/admin';
import { getAuthenticatedUser } from '@/lib/auth/middleware';

// POST: Create a new user (Admin only)
export async function POST(request: NextRequest) {
  const adminUser = await getAuthenticatedUser(request);
  if (!adminUser || adminUser.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado - Requiere rol Admin' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, password, nombre, rol, clienteId } = body;

    if (!email || !password || !nombre || !rol) {
      return NextResponse.json({ error: 'Faltan campos requeridos (email, password, nombre, rol)' }, { status: 400 });
    }

    if (!['admin', 'cliente'].includes(rol)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    if (rol === 'cliente' && !clienteId) {
      return NextResponse.json({ error: 'Falta clienteId para rol cliente' }, { status: 400 });
    }

    const cleanedClienteId = rol === 'cliente' ? clienteId : '';

    // 1. Create User in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: nombre,
    });

    const uid = userRecord.uid;

    // 2. Set Custom User Claims in Firebase Auth
    await adminAuth.setCustomUserClaims(uid, {
      rol,
      clienteId: cleanedClienteId,
    });

    // 3. Write user details to Firestore
    await adminFirestore.collection('usuarios').doc(uid).set({
      nombre,
      email,
      rol,
      clienteId: cleanedClienteId,
      creadoEn: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      user: {
        uid,
        email,
        nombre,
        rol,
        clienteId: cleanedClienteId,
      }
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'Error al crear el usuario' }, { status: 500 });
  }
}
