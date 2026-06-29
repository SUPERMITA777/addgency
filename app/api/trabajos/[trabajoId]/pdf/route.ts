import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore, adminStorage } from '@/lib/firebase/admin';
import { getAuthenticatedUser, checkAccess } from '@/lib/auth/middleware';
import { applyPdfWatermark } from '@/lib/watermark/pdf';

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

    // Download from Firebase Storage
    const bucket = adminStorage.bucket();
    const file = bucket.file(trabajo.archivoPath);
    
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ error: 'Archivo no encontrado en storage' }, { status: 404 });
    }

    const [fileBuffer] = await file.download();

    let outputBuffer = fileBuffer;
    if (trabajo.marcaDeAgua) {
      const watermarkText = process.env.WATERMARK_TEXT || 'PixelStudio';
      outputBuffer = await applyPdfWatermark(fileBuffer, watermarkText);
    }

    return new NextResponse(outputBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
