// ============================================================
// Middleware — GA4 Consent Handling
// מעביר GA4 GTM לאחרי הסכמה של המשתמש
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // הוסף header לבדיקת consent לפני טעינת GA4
  const response = NextResponse.next();
  response.headers.set('X-GA4-Require-Consent', 'true');
  return response;
}

export const config = {
  matcher: ['/:path*'],
};
