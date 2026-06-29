import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore, adminStorage } from '@/lib/firebase/admin';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { uploadToB2 } from '@/lib/backblaze/client';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || user.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado - Requiere rol Admin' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const clienteId = formData.get('clienteId') as string;
    const titulo = formData.get('titulo') as string;
    const descripcion = formData.get('descripcion') as string;
    const applyWatermark = formData.get('marcaDeAgua') === 'true';
    const fileEntry = formData.get('archivo') as File | null;

    if (!clienteId || !titulo || !fileEntry) {
      return NextResponse.json({ error: 'Faltan campos requeridos (clienteId, titulo, archivo)' }, { status: 400 });
    }

    const buffer = Buffer.from(await fileEntry.arrayBuffer());
    const fileName = `${Date.now()}_${fileEntry.name}`;
    const fileType = fileEntry.type;

    // Detect type (image, pdf, or video)
    let tipo: 'imagen' | 'pdf' | 'video' = 'imagen';
    if (fileType.startsWith('video/')) {
      tipo = 'video';
    } else if (fileType === 'application/pdf' || fileEntry.name.endsWith('.pdf')) {
      tipo = 'pdf';
    } else if (!fileType.startsWith('image/')) {
      return NextResponse.json({ error: 'Tipo de archivo no soportado (solo imagen, pdf o video)' }, { status: 400 });
    }

    let archivoUrl = '';
    let archivoBucket: 'firebase' | 'backblaze' = 'firebase';
    const archivoPath = `trabajos/${clienteId}/${fileName}`;

    if (tipo === 'video') {
      // Upload video to Backblaze B2
      archivoBucket = 'backblaze';
      const b2Response = await uploadToB2(buffer, archivoPath, fileType);
      archivoUrl = b2Response.url;
    } else {
      // Upload image/PDF to Firebase Storage
      archivoBucket = 'firebase';
      const bucket = adminStorage.bucket();
      const storageFile = bucket.file(archivoPath);
      await storageFile.save(buffer, {
        metadata: {
          contentType: fileType,
        },
      });
      archivoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(archivoPath)}?alt=media`;
    }

    // Save metadata in Firestore
    const newTrabajo = {
      clienteId,
      titulo,
      descripcion: descripcion || '',
      tipo,
      estado: 'en_revision',
      archivoUrl,
      archivoBucket,
      archivoPath,
      marcaDeAgua: applyWatermark,
      version: 1,
      creadoEn: FieldValue.serverTimestamp(),
      actualizadoEn: FieldValue.serverTimestamp(),
      creadoPor: user.uid,
    };

    const docRef = await adminFirestore.collection('trabajos').add(newTrabajo);
    const createdTrabajo = {
      id: docRef.id,
      ...newTrabajo,
    };

    return NextResponse.json(createdTrabajo, { status: 201 });
  } catch (error) {
    console.error('Error uploading work:', error);
    return NextResponse.json({ error: 'Error al subir el trabajo' }, { status: 500 });
  }
}
export const config = {
  api: {
    bodyParser: false, // Disables standard body parsing since we handle form-data
  },
};
