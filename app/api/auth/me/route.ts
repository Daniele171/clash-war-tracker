import { requireAuth } from '@/lib/auth';
import { apiSuccess, handleApiError } from '@/lib/api-response';

function emailToUsername(email: string): string {
  if (email.endsWith('@clan.local')) {
    return email.replace('@clan.local', '');
  }
  return email.split('@')[0];
}

export async function GET() {
  try {
    const auth = await requireAuth();
    const username = auth.user.user_metadata?.username || emailToUsername(auth.email);

    return apiSuccess({
      id: auth.user.id,
      email: auth.email,
      username,
      role: auth.role,
      isAdmin: auth.isAdmin,
      isMaster: auth.isMaster
    });
  } catch (error) {
    return handleApiError(error);
  }
}
