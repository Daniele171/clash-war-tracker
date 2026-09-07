import { requireMasterAdmin } from '@/lib/auth';
import { apiSuccess, handleApiError } from '@/lib/api-response';
import { getJson, setJson } from '@/lib/db';
import { TELEGRAM_SETTINGS_KEY } from '@/lib/constants';

export async function GET() {
  try {
    await requireMasterAdmin();
    const tgSettings = (await getJson(TELEGRAM_SETTINGS_KEY)) || {};
    return apiSuccess(tgSettings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireMasterAdmin();
    const body = await request.json().catch(() => ({}));
    const { token, chatId } = body;

    const tgSettings = { 
      token: typeof token === 'string' ? token.trim() : '', 
      chatId: typeof chatId === 'string' ? chatId.trim() : '' 
    };
    await setJson(TELEGRAM_SETTINGS_KEY, tgSettings);

    return apiSuccess({ success: true, settings: tgSettings });
  } catch (error) {
    return handleApiError(error);
  }
}
