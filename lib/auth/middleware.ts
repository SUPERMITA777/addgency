import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminFirestore } from '@/lib/firebase/admin';

export interface AuthUser {
  uid: string;
  email?: string;
  rol: 'admin' | 'cliente';
  clienteId?: string;
  nombre: string;
}

/**
 * Validates the session cookie server-side (for layout and page server components)
 */
export async function getServerSession(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('session')?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(sessionToken);
    const userDoc = await adminFirestore.collection('usuarios').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      rol: userData?.rol || 'cliente',
      clienteId: userData?.clienteId,
      nombre: userData?.nombre || '',
    };
  } catch (error) {
    console.error('Server session validation failed:', error);
    return null;
  }
}

/**
 * Validates the Authorization header (Bearer token) and returns the authenticated user data
 * from the Firestore 'usuarios' collection.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userDoc = await adminFirestore.collection('usuarios').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      rol: userData?.rol || 'cliente',
      clienteId: userData?.clienteId,
      nombre: userData?.nombre || '',
    };
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
}

/**
 * Checks if the user is an admin or belongs to the specified tenant/client.
 */
export function checkAccess(user: AuthUser, clienteId: string): boolean {
  if (user.rol === 'admin') return true;
  return user.clienteId === clienteId;
}
