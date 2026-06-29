import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get('subdomain');

  if (!subdomain) {
    return NextResponse.json({ exists: false }, { status: 400 });
  }

  try {
    const snapshot = await adminFirestore
      .collection('clientes')
      .where('subdominio', '==', subdomain)
      .where('activo', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ exists: false });
    }

    const doc = snapshot.docs[0];
    return NextResponse.json({ exists: true, clienteId: doc.id });
  } catch (error) {
    console.error('Error checking subdomain:', error);
    return NextResponse.json({ exists: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
