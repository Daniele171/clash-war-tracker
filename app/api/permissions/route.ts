import { requireAuth, requireMasterAdmin } from '@/lib/auth';
import { apiSuccess, handleApiError } from '@/lib/api-response';
import { setJson } from '@/lib/db';
import { PERMISSIONS_KEY, AppPermissions } from '@/lib/constants';

export async function GET() {
  try {
    const auth = await requireAuth();
    return apiSuccess({ 
      permissions: auth.permissions, 
      isMaster: auth.isMaster 
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMasterAdmin();
    const body = await request.json().catch(() => ({}));

    const sanitized: AppPermissions = {
      adminCanCreateUser: Boolean(body.adminCanCreateUser),
      adminCanDeleteUser: Boolean(body.adminCanDeleteUser),
      adminCanExcuse: Boolean(body.adminCanExcuse),
      adminCanForceSync: Boolean(body.adminCanForceSync),
      adminCanChangeRole: Boolean(body.adminCanChangeRole),
    };

    await setJson(PERMISSIONS_KEY, sanitized);
    return apiSuccess({ success: true, permissions: sanitized });
  } catch (error) {
    return handleApiError(error);
  }
}
