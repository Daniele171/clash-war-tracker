import { getLiveWar, getJson } from '@/lib/db';
import { verifyCronSecret, getAuthContext } from '@/lib/auth';
import { apiSuccess, apiUnauthorized, apiError, handleApiError } from '@/lib/api-response';
import { TELEGRAM_SETTINGS_KEY } from '@/lib/constants';

export async function GET(request: Request) {
  const isCronAuthorized = verifyCronSecret(request);
  let isMasterAuthorized = false;
  
  if (!isCronAuthorized) {
    const auth = await getAuthContext();
    if (auth?.isAdmin) {
      isMasterAuthorized = true;
    }
  }

  // Permettiamo il test dal frontend (Admin)
  const url = new URL(request.url);
  const isTest = url.searchParams.get('test') === 'true';

  if (!isCronAuthorized && !isMasterAuthorized) {
    return apiUnauthorized('Richiesta non autorizzata: cron secret o sessione Admin richiesta');
  }

  try {
    const tgSettings = (await getJson(TELEGRAM_SETTINGS_KEY)) || {};
    const token = tgSettings.token || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = tgSettings.chatId || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return apiError('Configurazione Telegram mancante (Token o Chat ID non impostati)', 500);
    }

    if (tgSettings.enableStartMessage === false && !isTest) {
       return apiSuccess({ success: true, message: 'Avviso Inizio Giornata disabilitato nelle impostazioni' });
    }

    const data = await getLiveWar();
    if (!data) {
      return apiError('Nessun dato di guerra live disponibile', 400);
    }

    let report = tgSettings.customStartMessage 
      ? `${tgSettings.customStartMessage}\n\n` 
      : '🌅 *BUONGIORNO CLAN!* 🌅\n\n';

    if (data.periodType === 'training') {
      report += '🛡️ È iniziata una nuova **Giornata di Allenamento**!\n';
      report += 'Approfittate di oggi per testare le difese e perfezionare i vostri 4 mazzi per domani.\n\n';
    } else {
      report += '⚔️ SVEGLIA! È iniziata una nuova **Giornata di BATTAGLIA!**\n';
      report += 'Avete tempo fino a domani alle 12:00 per completare tutti i vostri 4 attacchi al fiume! Dai dai dai! 🚀\n\n';
    }

    report += `\n🔍 Dashboard: https://clash-war-tracker-v3.vercel.app/`;

    if (isTest) {
      report = "🧪 [MESSAGGIO DI PROVA]\n\n" + report;
    }

    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: report })
    });

    if (!res.ok) {
      return apiError('Errore durante l\'invio a Telegram', 500, await res.text());
    }

    return apiSuccess({ success: true, message: 'Avviso Inizio Giornata inviato su Telegram' });
  } catch (error) {
    return handleApiError(error);
  }
}
