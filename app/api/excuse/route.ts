import { requirePermission } from '@/lib/auth';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';
import { setExcuse, removeExcuse } from '@/lib/db';

export async function POST(request: Request) {
  try {
    await requirePermission('adminCanExcuse');

    const body = await request.json().catch(() => ({}));
    const { tag, reason } = body;
    
    if (!tag || typeof tag !== 'string') {
      return apiError('Tag mancante o non valido', 400);
    }

    const cleanTag = tag.trim();
    const cleanReason = typeof reason === 'string' && reason.trim() ? reason.trim() : 'Giustificato';

    await setExcuse(cleanTag, cleanReason);
    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requirePermission('adminCanExcuse');

    const body = await request.json().catch(() => ({}));
    const { tag } = body;

    if (!tag || typeof tag !== 'string') {
      return apiError('Tag mancante o non valido', 400);
    }

    await removeExcuse(tag.trim());
    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
