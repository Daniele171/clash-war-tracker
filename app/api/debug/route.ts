import { requireMasterAdmin } from '@/lib/auth';
import { apiSuccess, handleApiError } from '@/lib/api-response';

export async function GET() {
  try {
    await requireMasterAdmin();
    return apiSuccess({ 
      status: 'ok',
      hasRedis: !!process.env.REDIS_URL,
      hasKV: !!process.env.KV_REST_API_URL,
      hasSupercellKey: !!process.env.CLASH_ROYALE_API_KEY || !!process.env.CR_API_KEY
    });
  } catch (error) {
    return handleApiError(error);
  }
}
