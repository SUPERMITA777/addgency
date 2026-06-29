import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Exclude static assets, Next.js internals, and files (favicon, logos, etc.)
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow check-subdomain API route without interception
  if (url.pathname.startsWith('/api/clientes/check-subdomain')) {
    return NextResponse.next();
  }

  // Parse path segments
  const pathSegments = url.pathname.split('/').filter(Boolean);
  
  // If there are no segments, it's the home page
  if (pathSegments.length === 0) {
    return NextResponse.next();
  }

  const firstSegment = pathSegments[0].toLowerCase();

  // Exclude system paths from tenant routing
  const reservedPaths = ['login', 'admin', 'api'];
  if (reservedPaths.includes(firstSegment)) {
    return NextResponse.next();
  }

  // Prevent direct access to /cliente/[clienteId] or general /cliente paths
  if (firstSegment === 'cliente') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // It's a potential tenant path (e.g. /nombredeltenant/...)
  // Check if this tenant exists using our verification API
  try {
    const origin = url.origin;
    const checkUrl = `${origin}/api/clientes/check-subdomain?subdomain=${firstSegment}`;
    const res = await fetch(checkUrl);

    if (res.ok) {
      const data = await res.json();
      if (data.exists && data.clienteId) {
        // Rewrite /nombredeltenant/path -> /cliente/[clienteId]/path internally
        const remainingPath = pathSegments.slice(1).join('/');
        url.pathname = `/cliente/${data.clienteId}${remainingPath ? '/' + remainingPath : ''}`;
        return NextResponse.rewrite(url);
      }
    }
  } catch (err) {
    console.error('Tenant path middleware lookup error:', err);
  }

  // Tenant does not exist, redirect to root landing
  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
