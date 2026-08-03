// ============================================================
// Middleware
//  1) GA4 consent header (all paths) — unchanged.
//  2) CRM gate — protects /crm/* (except the login page) behind a session
//     cookie whose value must equal sha256(CRM_ACCESS_KEY). Everything
//     outside /crm is passed through untouched.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'crm_session';

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- CRM gate (only for /crm, excluding the login page) ---
  if (pathname.startsWith('/crm') && pathname !== '/crm/login') {
    const key = process.env.CRM_ACCESS_KEY;
    // If not configured, fail closed to the login page (never expose data).
    const expected = key ? await sha256Hex(key) : null;
    const token = request.cookies.get(COOKIE)?.value;
    if (!expected || token !== expected) {
      const url = request.nextUrl.clone();
      url.pathname = '/crm/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  // --- existing GA4 consent header (all paths) ---
  const response = NextResponse.next();
  response.headers.set('X-GA4-Require-Consent', 'true');
  return response;
}

export const config = {
  matcher: ['/:path*'],
};
