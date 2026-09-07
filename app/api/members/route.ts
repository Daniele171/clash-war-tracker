import { getMembers } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiSuccess, handleApiError } from '@/lib/api-response';

export async function GET() {
  try {
    await requireAuth();
    const members = await getMembers();
    return apiSuccess(members);
  } catch (error) {
    return handleApiError(error);
  }
}
