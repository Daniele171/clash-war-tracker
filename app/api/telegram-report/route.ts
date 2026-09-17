import { getLiveWar, saveLiveWar, getWarSnapshot, saveWarSnapshot, getJson } from '@/lib/db';
import { verifyCronSecret, getAuthContext } from '@/lib/auth';
import { apiSuccess, apiUnauthorized, apiError, handleApiError } from '@/lib/api-response';
import { TELEGRAM_SETTINGS_KEY } from '@/lib/constants';
import { getCurrentRiverRace, getClanMembers } from '@/lib/cr-api';
import { buildWarSnapshot } from '@/lib/war-utils';

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



    // ⚡ SYNC FRESCO: leggi direttamente dall'API CR prima di inviare il report
    // Questo evita il bug dove il DB ha ancora 'training' ma la war è già iniziata
    const clanTag = process.env.CLAN_TAG;
    let data = await getLiveWar();

    if (clanTag) {
      try {
        const race = await getCurrentRiverRace(clanTag);
        if (race && race.clan) {
          // Recupera le scuse esistenti
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
        // Se il sync fallisce, usiamo i dati del DB come fallback
        console.warn('Sync fresco fallito, uso dati DB:', syncError);
      }
    }

    if (data && data.periodType !== 'training' && data.battleDay > 0) {
      const existing = await getWarSnapshot(data.seasonId, data.battleDay);
      if (!existing) {
        const finalSnapshot = {
          ...data,
          participants: data.participants.map((p: any) => ({
            ...p,
            status: p.status === 'excused' ? 'excused'
                : p.decksUsedToday === 0 ? 'absent'
                : p.decksUsedToday < 4 ? 'partial'
                : 'ok'
          }))
        };
        await saveWarSnapshot(data.seasonId, data.battleDay, finalSnapshot);
        // Nota: non duplichiamo l'aggiornamento storico (GlobalStats) qui. 
        // Verrà fatto da /api/sync se necessario, oppure è sufficiente avere lo snapshot corretto salvato!
        // Ma in realtà per sicurezza l'update delle stats storiche sarebbe meglio eseguirlo.
      }
    }

    if (tgSettings.enableDailyReport === false && isCronAuthorized) {
       return apiSuccess({ success: true, message: 'Sync di fine giornata eseguito. Report automatico Telegram disabilitato.' });
    }

    if (!data) {
      return apiError('Nessun dato di guerra live disponibile', 400);
    }

    const participants = data.participants || [];
    const pendings = [...participants].filter((p: any) => p.status === 'pending');
    const absents = [...participants].filter((p: any) => p.status === 'absent');
    const missing = [...absents, ...pendings].sort((a: any, b: any) => a.name.localeCompare(b.name));
    const partials = [...participants].filter((p: any) => p.status === 'partial').sort((a: any, b: any) => a.name.localeCompare(b.name));
    const isTraining = data.periodType === 'training';

    let report = isTraining ? '🛡️ *REPORT ALLENAMENTO* 🛡️\n\n' : '⚠️ *REPORT GUERRA FLUVIALE* ⚠️\n\n';
    
    if (isTraining) {
      report += 'Oggi è giorno di allenamento! Preparate le difese della barca e testate i mazzi per i giorni di combattimento. ⚔️\n\n';
      const participantsCount = participants.filter((p: any) => p.decksUsedToday > 0).length;
      report += `✅ ${participantsCount} membri hanno già fatto almeno un attacco di prova.\n`;
    } else {
      const battleDay = (data as any).battleDay || '?';
      report += `📅 *Giorno ${battleDay} di Combattimento*\n\n`;

      if (missing.length > 0) {
        report += '❌ *ANCORA DA GIOCARE (0/4 mazzi):*\n';
        missing.forEach((p: any) => {
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

      if (missing.length === 0 && partials.length === 0) {
        report += '✅ Tutti i membri hanno completato gli attacchi! Grandissimi! 🏆\n';
      } else {
        if (missing.length > 35) {
          report += 'La nuova giornata di guerra è appena iniziata! Buona fortuna a tutti! ⚔️\n';
        } else {
          report += '@everyone per favore fate gli attacchi! ⚔️\n';
        }
      }
    }

    report += `\n🔍 Controlla i dettagli qui:\nhttps://clash-war-tracker-v3.vercel.app/`;

    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: report, parse_mode: 'Markdown' })
    });

    if (!res.ok) {
      return apiError('Errore durante l\'invio a Telegram', 500, await res.text());
    }

    return apiSuccess({ success: true, message: 'Report inviato su Telegram', periodType: data.periodType });
  } catch (error) {
    return handleApiError(error);
  }
}
