import { NextRequest } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('adminCanForceSync');

    const syncUrl = new URL('/api/sync', request.url);
    const syncReq = new Request(syncUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      }
    });
    return await fetch(syncReq);
  } catch (error) {
    return handleApiError(error);
  }
}
