// Gated global search for the Command Palette. Returns a few matching club
// members. Auth required (CRM session cookie) since this exposes emails.

import { NextRequest, NextResponse } from 'next/server';
import { isCrmAuthed } from '@/lib/crm/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!isCrmAuthed(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ members: [] });

  try {
    const members = await prisma.clubMember.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { couponCode: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { email: true, couponCode: true, couponUsed: true },
    });
    return NextResponse.json({ members });
  } catch {
    return NextResponse.json({ members: [] });
  }
}
