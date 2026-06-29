import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Exclude static assets, Next.js internals, and files (favicon, logos, etc.)
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow check-subdomain API route without interception, but intercept other API paths if needed
  if (url.pathname.startsWith('/api/clientes/check-subdomain')) {
    return NextResponse.next();
  }

  const mainDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'tuagencia.com';
  let subdomain = '';

  // Extract subdomain from hostname
  if (hostname.includes(mainDomain)) {
    const part = hostname.replace(mainDomain, '').replace(/:[0-9]+$/, '').trim();
    if (part.endsWith('.')) {
      subdomain = part.slice(0, -1);
    }
  } else if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const parts = hostname.replace(/:[0-9]+$/, '').split('.');
    if (parts.length > 1) {
      subdomain = parts[0];
    }
  }

  // If no subdomain, or if it is 'www' or 'admin', it is the root domain
  if (!subdomain || subdomain === 'www' || subdomain === 'admin') {
    // Prevent direct access to /cliente/[clienteId] or general /cliente paths on the root domain
    if (url.pathname.startsWith('/cliente')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Prevent subdomains from accessing admin paths
  if (url.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // It's a client subdomain, fetch details from our check endpoint
  try {
    const origin = url.origin;
    const checkUrl = `${origin}/api/clientes/check-subdomain?subdomain=${subdomain}`;
    const res = await fetch(checkUrl);

    if (res.ok) {
      const data = await res.json();
      if (data.exists && data.clienteId) {
        // Rewrite the request internally to /cliente/[clienteId]/...
        // For example: /trabajos -> /cliente/[clienteId]/trabajos
        const path = url.pathname === '/' ? '' : url.pathname;
        url.pathname = `/cliente/${data.clienteId}${path}`;
        return NextResponse.rewrite(url);
      }
    }
  } catch (err) {
    console.error('Subdomain middleware lookup error:', err);
  }

  // Subdomain does not exist, redirect to root landing
  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: [
    // Apply middleware to all routes except static assets
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
