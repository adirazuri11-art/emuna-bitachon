// Server-side guard for CRM API routes. The middleware only protects /crm
// *pages*; API routes under /api/crm must verify the session cookie themselves.

import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';

export function isCrmAuthed(request: NextRequest): boolean {
  const key = process.env.CRM_ACCESS_KEY;
  if (!key) return false;
  const expected = createHash('sha256').update(key).digest('hex');
  return request.cookies.get('crm_session')?.value === expected;
}
