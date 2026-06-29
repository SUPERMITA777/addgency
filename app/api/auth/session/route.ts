import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Token no proveído' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userDoc = await adminFirestore.collection('usuarios').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Registro de usuario no encontrado en la base de datos' }, { status: 404 });
    }

    const userData = userDoc.data();
    const rol = userData?.rol || 'cliente';
    const clienteId = userData?.clienteId || null;

    const response = NextResponse.json({
      uid: decodedToken.uid,
      rol,
      clienteId,
    });

    // Guardar el token en una cookie httpOnly segura para lectura en layouts de servidor
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 5, // 5 días
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Session API verification failed:', error);
    return NextResponse.json({ error: 'Fallo de autenticación' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('session');
  return response;
}
