import { requirePermission } from '@/lib/auth';
import { apiSuccess, handleApiError } from '@/lib/api-response';
import { getJson, setJson } from '@/lib/db';
import { GLOBAL_SETTINGS_KEY, DEFAULT_GLOBAL_SETTINGS } from '@/lib/constants';

export async function GET() {
  try {
    const settings = (await getJson(GLOBAL_SETTINGS_KEY)) || {};
    return apiSuccess({ ...DEFAULT_GLOBAL_SETTINGS, ...settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission('adminCanManageGlobalSettings');
    const body = await request.json().catch(() => ({}));
    
    const settings = {
      showLiveBanner: typeof body.showLiveBanner === 'boolean' ? body.showLiveBanner : DEFAULT_GLOBAL_SETTINGS.showLiveBanner,
      sortByDecksToday: typeof body.sortByDecksToday === 'boolean' ? body.sortByDecksToday : DEFAULT_GLOBAL_SETTINGS.sortByDecksToday,
      hideZeroMedalsTraining: typeof body.hideZeroMedalsTraining === 'boolean' ? body.hideZeroMedalsTraining : DEFAULT_GLOBAL_SETTINGS.hideZeroMedalsTraining,
      missedDecksWarningThreshold: typeof body.missedDecksWarningThreshold === 'number' ? body.missedDecksWarningThreshold : DEFAULT_GLOBAL_SETTINGS.missedDecksWarningThreshold,
      hoursBeforeEndForWarning: typeof body.hoursBeforeEndForWarning === 'number' ? body.hoursBeforeEndForWarning : DEFAULT_GLOBAL_SETTINGS.hoursBeforeEndForWarning,
      compactMode: typeof body.compactMode === 'boolean' ? body.compactMode : DEFAULT_GLOBAL_SETTINGS.compactMode,
    };

    await setJson(GLOBAL_SETTINGS_KEY, settings);
    return apiSuccess({ success: true, settings });
  } catch (error) {
    return handleApiError(error);
  }
}
