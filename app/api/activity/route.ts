import { requireAuth } from '@/lib/auth';
import { apiSuccess, handleApiError } from '@/lib/api-response';
import { setJson } from '@/lib/db';

export async function POST() {
  try {
    const auth = await requireAuth();
    await setJson(`cwt:activity:${auth.user.id}`, { lastActiveAt: new Date().toISOString() });
    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
