import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { getAuthenticatedUser, checkAccess } from '@/lib/auth/middleware';
import { getSignedUrl } from '@/lib/backblaze/client';

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

    if (trabajo.tipo !== 'video') {
      return NextResponse.json({ error: 'El trabajo no es un video' }, { status: 400 });
    }

    // Generate signed URL from Backblaze B2 (expires in 2 hours = 7200 seconds)
    const validitySeconds = 7200;
    const signedUrl = await getSignedUrl(trabajo.archivoPath, validitySeconds);
    const expiresAt = new Date(Date.now() + validitySeconds * 1000).toISOString();

    return NextResponse.json({
      url: signedUrl,
      expiresAt,
    });
  } catch (error) {
    console.error('Error generating signed video URL:', error);
    return NextResponse.json({ error: 'Error al generar enlace de video' }, { status: 500 });
  }
}
