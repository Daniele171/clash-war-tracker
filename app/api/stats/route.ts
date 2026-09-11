import { NextResponse } from 'next/server';
import { getClanStats } from '@/lib/db';
import { handleApiError, apiSuccess } from '@/lib/api-response';

export async function GET() {
  try {
    const stats = await getClanStats();
    return apiSuccess({ stats: Object.values(stats) });
  } catch (error) {
    return handleApiError(error);
  }
}
