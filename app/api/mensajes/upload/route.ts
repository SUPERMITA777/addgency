import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase/admin';
import { getAuthenticatedUser, checkAccess } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const clienteId = formData.get('clienteId') as string;
    const fileEntry = formData.get('archivo') as File | null;

    if (!clienteId || !fileEntry) {
      return NextResponse.json({ error: 'Campos requeridos faltantes (clienteId, archivo)' }, { status: 400 });
    }

    // Verify tenant access
    if (!checkAccess(user, clienteId)) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    const buffer = Buffer.from(await fileEntry.arrayBuffer());
    const fileName = `${Date.now()}_${fileEntry.name}`;
    const fileType = fileEntry.type;
    const path = `mensajes/${clienteId}/${fileName}`;

    // Upload to Firebase Storage
    const bucket = adminStorage.bucket();
    const storageFile = bucket.file(path);
    await storageFile.save(buffer, {
      metadata: {
        contentType: fileType,
      },
    });

    // Generate public download URL
    const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media`;

    return NextResponse.json({
      url: fileUrl,
      nombre: fileEntry.name,
      tipo: fileType,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading message attachment:', error);
    return NextResponse.json({ error: 'Error al subir archivo adjunto' }, { status: 500 });
  }
}
