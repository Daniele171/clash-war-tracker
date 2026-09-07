import { NextResponse } from 'next/server';
import { getLiveWar, getJson } from '@/lib/db';

export async function GET(request: Request) {
  // Check authorization via secret query param or header
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');

  // Verify simple secret to prevent unauthorized abuse of the cron endpoint
  if (secret !== process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getLiveWar();
    if (!data) {
      return NextResponse.json({ error: 'No live war data available' }, { status: 400 });
    }

    const tgSettings = await getJson('cwt:settings:telegram') || {};
    const token = tgSettings.token || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = tgSettings.chatId || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json({ error: 'Telegram configuration is missing' }, { status: 500 });
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

    // Send to Telegram
    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: report,
      })
    });

    if (!res.ok) {
      const tgError = await res.text();
      return NextResponse.json({ error: 'Failed to send to Telegram', details: tgError }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Report sent to Telegram' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
