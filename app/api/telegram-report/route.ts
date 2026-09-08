import { getLiveWar, getJson } from '@/lib/db';
import { verifyCronSecret, getAuthContext } from '@/lib/auth';
import { apiSuccess, apiUnauthorized, apiError, handleApiError } from '@/lib/api-response';
import { TELEGRAM_SETTINGS_KEY } from '@/lib/constants';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isTest = searchParams.get('test') === 'true';

  const isCronAuthorized = verifyCronSecret(request);
  let isMasterAuthorized = false;
  
  if (!isCronAuthorized) {
    const auth = await getAuthContext();
    if (auth?.isMaster) {
      isMasterAuthorized = true;
    }
  }

  if (!isCronAuthorized && !isMasterAuthorized) {
    return apiUnauthorized('Richiesta non autorizzata: cron secret o sessione Master Admin richiesta');
  }

  try {
    const tgSettings = (await getJson(TELEGRAM_SETTINGS_KEY)) || {};
    const token = tgSettings.token || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = tgSettings.chatId || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return apiError('Configurazione Telegram mancante (Token o Chat ID non impostati)', 500);
    }

    if (isTest) {
      const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
      const res = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: '👋 Ciao! Questo è un messaggio di test inviato dal pannello di amministrazione di Clash War Tracker. Il bot funziona correttamente! 🚀' })
      });
      if (!res.ok) return apiError('Errore durante l\'invio del test', 500, await res.text());
      return apiSuccess({ success: true, message: 'Test inviato' });
    }

    if (tgSettings.enableDailyReport === false && isCronAuthorized) {
       return apiSuccess({ success: true, message: 'Report automatico disabilitato nelle impostazioni' });
    }

    const data = await getLiveWar();
    if (!data) {
      return apiError('Nessun dato di guerra live disponibile', 400);
    }

    const participants = data.participants || [];
    const absents = [...participants].filter((p: any) => p.status === 'absent').sort((a: any, b: any) => a.name.localeCompare(b.name));
    const partials = [...participants].filter((p: any) => p.status === 'partial').sort((a: any, b: any) => a.name.localeCompare(b.name));
    const isTraining = data.periodType === 'training';

    let report = isTraining ? '🛡️ *REPORT ALLENAMENTO* 🛡️\n\n' : '⚠️ *REPORT GUERRA FLUVIALE* ⚠️\n\n';
    
    if (isTraining) {
      report += 'Oggi è giorno di allenamento! Preparate le difese della barca e testate i mazzi per i giorni di combattimento. ⚔️\n\n';
      const participantsCount = participants.filter((p: any) => p.decksUsedToday > 0).length;
      report += `✅ ${participantsCount} membri hanno già fatto almeno un attacco di prova.\n`;
    } else {
      if (absents.length > 0) {
        report += '❌ *ASSENTI TOTALI (0/4 mazzi):*\n';
        absents.forEach((p: any) => {
          report += `- ${p.name}\n`;
        });
        report += '\n';
      }

      if (partials.length > 0) {
        report += '⚠️ *PARZIALI (Non hanno finito):*\n';
        partials.forEach((p: any) => {
          report += `- ${p.name} (${p.decksUsedToday}/4 mazzi)\n`;
        });
        report += '\n';
      }

      if (absents.length === 0 && partials.length === 0) {
        report += '✅ Tutti i membri hanno completato gli attacchi! Grandissimi! 🏆\n';
      } else {
        report += '@everyone per favore fate gli attacchi! ⚔️\n';
      }
    }

    report += `\n🔍 Controlla i dettagli qui:\nhttps://clash-war-tracker-v3.vercel.app/`;

    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: report })
    });

    if (!res.ok) {
      return apiError('Errore durante l\'invio a Telegram', 500, await res.text());
    }

    return apiSuccess({ success: true, message: 'Report inviato su Telegram' });
  } catch (error) {
    return handleApiError(error);
  }
}
