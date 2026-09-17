import { getLiveWar, saveLiveWar, getJson } from '@/lib/db';
import { verifyCronSecret, getAuthContext } from '@/lib/auth';
import { apiSuccess, apiUnauthorized, apiError, handleApiError } from '@/lib/api-response';
import { TELEGRAM_SETTINGS_KEY } from '@/lib/constants';
import { getCurrentRiverRace, getClanMembers } from '@/lib/cr-api';
import { buildWarSnapshot } from '@/lib/war-utils';

export async function GET(request: Request) {
  const isCronAuthorized = verifyCronSecret(request);
  let isMasterAuthorized = false;
  
  if (!isCronAuthorized) {
    const auth = await getAuthContext();
    if (auth?.isAdmin) {
      isMasterAuthorized = true;
    }
  }

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

    // ⚡ SYNC FRESCO: leggi direttamente dall'API CR
    const clanTag = process.env.CLAN_TAG;
    let data = await getLiveWar();

    if (clanTag) {
      try {
        const race = await getCurrentRiverRace(clanTag);
        if (race && race.clan) {
          const existingExcuses: Record<string, string> = {};
          if (data) {
            data.participants.forEach((p: any) => {
              if (p.status === 'excused' && p.excuseReason) {
                existingExcuses[p.tag] = p.excuseReason;
              }
            });
          }
          const membersData = await getClanMembers(clanTag);
          const apiMembers = membersData?.items || [];
          const freshSnapshot = buildWarSnapshot(race, apiMembers, false, existingExcuses);
          await saveLiveWar(freshSnapshot);
          data = freshSnapshot;
        }
      } catch (syncError) {
        console.warn('Sync fresco fallito, uso dati DB:', syncError);
      }
    }

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
      const battleDay = (data as any).battleDay || '?';
      report += `⚔️ SVEGLIA! È iniziata la **Giornata di BATTAGLIA ${battleDay}!**\n`;
      report += 'Avete tempo fino a domani alle 12:00 per completare tutti i vostri 4 attacchi al fiume! Dai dai dai! 🚀\n\n';
    }

    report += `\n🔍 Dashboard: https://clash-war-tracker-v3.vercel.app/`;

    if (isTest) {
      report = '🧪 [MESSAGGIO DI PROVA]\n\n' + report;
    }

    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: report, parse_mode: 'Markdown' })
    });

    if (!res.ok) {
      return apiError('Errore durante l\'invio a Telegram', 500, await res.text());
    }

    return apiSuccess({ success: true, message: 'Avviso Inizio Giornata inviato su Telegram', periodType: data.periodType });
  } catch (error) {
    return handleApiError(error);
  }
}
