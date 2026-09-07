import { NextRequest } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { apiSuccess, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('adminCanForceSync');

    const syncUrl = new URL('/api/sync', request.url);
    const syncReq = new Request(syncUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      }
    });

    const res = await fetch(syncReq);
    const data = await res.json().catch(() => ({}));

    return apiSuccess({
      ok: true,
      updated: data.success === true,
      battleDay: data.battleDay,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
