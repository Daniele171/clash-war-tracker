import { NextResponse } from 'next/server';
import { setExcuse, removeExcuse } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { tag, reason } = await request.json();
    if (!tag) return NextResponse.json({ error: 'Missing tag' }, { status: 400 });
    const ok = await setExcuse(tag, reason || 'Giustificato');
    if (!ok) return NextResponse.json({ error: 'Member not found in current war' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { tag } = await request.json();
    if (!tag) return NextResponse.json({ error: 'Missing tag' }, { status: 400 });
    const ok = await removeExcuse(tag);
    if (!ok) return NextResponse.json({ error: 'Member not found in current war' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
