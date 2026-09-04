import { NextResponse } from 'next/server';
import { getMembers } from '@/lib/db';

export async function GET() {
  try {
    const members = await getMembers();
    return NextResponse.json(members);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
