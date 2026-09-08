import { requirePermission } from '@/lib/auth';
import { apiSuccess, handleApiError } from '@/lib/api-response';
import { getJson, setJson } from '@/lib/db';
import { TELEGRAM_SETTINGS_KEY } from '@/lib/constants';

export async function GET() {
  try {
    await requirePermission('adminCanConfigureBot');
    const tgSettings = (await getJson(TELEGRAM_SETTINGS_KEY)) || {};
    return apiSuccess(tgSettings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission('adminCanConfigureBot');
    const body = await request.json().catch(() => ({}));
    const { token, chatId, enableDailyReport, enableHourlyWarning, customWarningMessage } = body;

    const tgSettings = { 
      token: typeof token === 'string' ? token.trim() : '', 
      chatId: typeof chatId === 'string' ? chatId.trim() : '',
      enableDailyReport: typeof enableDailyReport === 'boolean' ? enableDailyReport : true,
      enableHourlyWarning: typeof enableHourlyWarning === 'boolean' ? enableHourlyWarning : false,
      customWarningMessage: typeof customWarningMessage === 'string' ? customWarningMessage.trim() : ''
    };
    await setJson(TELEGRAM_SETTINGS_KEY, tgSettings);

    return apiSuccess({ success: true, settings: tgSettings });
  } catch (error) {
    return handleApiError(error);
  }
}
