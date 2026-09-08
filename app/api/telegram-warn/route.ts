import { getLiveWar, getJson } from '@/lib/db';
import { verifyCronSecret, getAuthContext } from '@/lib/auth';
import { apiSuccess, apiUnauthorized, apiError, handleApiError } from '@/lib/api-response';
import { TELEGRAM_SETTINGS_KEY } from '@/lib/constants';

export async function GET(request: Request) {
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

    if (tgSettings.enableHourlyWarning === false) {
       return apiSuccess({ success: true, message: 'Avviso di 1 ora prima disabilitato nelle impostazioni' });
    }

    const data = await getLiveWar();
    if (!data) {
      return apiError('Nessun dato di guerra live disponibile', 400);
    }

    // Se è giorno di allenamento, non inviamo l'avviso di emergenza
    if (data.periodType === 'training') {
      return apiSuccess({ success: true, message: 'Giorno di allenamento, nessun avviso necessario' });
    }

    const participants = data.participants || [];
    const absents = [...participants].filter((p: any) => p.status === 'absent');
    const partials = [...participants].filter((p: any) => p.status === 'partial');

    // Se tutti hanno fatto gli attacchi, non inviamo nulla
    if (absents.length === 0 && partials.length === 0) {
      return apiSuccess({ success: true, message: 'Tutti hanno attaccato, nessun avviso necessario' });
    }

    let report = tgSettings.customWarningMessage 
      ? `${tgSettings.customWarningMessage}\n\n` 
      : '⚠️ *MANCA 1 ORA ALLA FINE DELLA GUERRA!* ⚠️\n\n';
    
    report += '@everyone mancano ancora degli attacchi! Sbrigatevi! ⚔️\n\n';

    if (absents.length > 0) {
      report += '❌ *NON HANNO ANCORA ATTACCATO:*\n';
      absents.forEach((p: any) => {
        report += `- ${p.name}\n`;
      });
      report += '\n';
    }

    if (partials.length > 0) {
      report += '⚠️ *DEVONO FINIRE I MAZZI:*\n';
      partials.forEach((p: any) => {
        report += `- ${p.name} (${p.decksUsedToday}/4 mazzi)\n`;
      });
      report += '\n';
    }

    report += `\n🔍 Dettagli: https://clash-war-tracker-v3.vercel.app/`;

    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: report })
    });

    if (!res.ok) {
      return apiError('Errore durante l\'invio a Telegram', 500, await res.text());
    }

    return apiSuccess({ success: true, message: 'Avviso inviato su Telegram' });
  } catch (error) {
    return handleApiError(error);
  }
}
