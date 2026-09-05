'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function WarTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/wars')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        setData({ error: e.message });
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-20 text-[#8888a8]">Caricamento...</div>;

  if (data?.error) return (
    <div className="text-center py-12 px-6 bg-[rgba(220,38,38,0.1)] border border-red-500 rounded-xl">
      <div className="text-[48px] mb-4 block">🚨</div>
      <div className="font-rajdhani text-[20px] font-bold text-red-400 mb-2">Errore di Sistema</div>
      <div className="text-[13px] text-red-300 mb-4">{data.error}</div>
      <div className="text-[12px] text-[#8888a8]">
        Controlla le variabili d'ambiente su Vercel. Se l'errore dice "KV_REST_API_URL", 
        significa che il database non ha iniettato il nome corretto.
      </div>
    </div>
  );

  if (!data || data.status) return (
    <div className="text-center py-12 px-6 text-[#8888a8]">
      <span className="text-[48px] mb-4 opacity-50 block">🏁</span>
      <div className="font-rajdhani text-[20px] font-bold text-[#f0f0ff] mb-2">Nessuna War Attiva</div>
      <div className="text-[13px] leading-relaxed">
        Premi il bottone 🔄 in alto per sincronizzare da Clash Royale.<br/>
        Se hai appena iniziato, ricorda di inserire API Key e Clan Tag nelle Impostazioni.
      </div>
    </div>
  );

  const total = data.participants?.length || 0;
  const participated = data.participants?.filter((p: any) => p.decksUsedToday > 0).length || 0;
  const excusedCount = data.participants?.filter((p: any) => p.status === 'excused').length || 0;
  const badCount = data.participants?.filter((p: any) => p.status === 'absent' || p.status === 'pending').length || 0;
  const totalMedals = data.participants?.reduce((s: number, p: any) => s + (p.medals || 0), 0) || 0;
  
  const denominator = Math.max(total - excusedCount, 1);
  const rate = Math.round((participated / denominator) * 100);
  const rateColor = rate >= 80 ? '#4ade80' : rate >= 60 ? '#fb923c' : '#f87171';

  const sorted = [...(data.participants || [])].sort((a, b) => {
    if (b.medals !== a.medals) return b.medals - a.medals;
    return b.decksUsedToday - a.decksUsedToday;
  });

  const handleExcuse = async (tag: string, name: string, currentStatus: string) => {
    if (currentStatus === 'excused') {
      if (!confirm(`Rimuovi la giustificazione di ${name}?`)) return;
      try {
        const res = await fetch('/api/excuse', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag })
        });
        if (res.ok) window.location.reload();
        else alert('Errore nella rimozione giustificazione');
      } catch { alert('Errore di rete'); }
    } else {
      const reason = prompt(`Giustifica ${name} per OGGI (scrivi il motivo o lascia vuoto):`);
      if (reason === null) return;
      try {
        const res = await fetch('/api/excuse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag, reason: reason || 'Giustificato' })
        });
        if (res.ok) window.location.reload();
        else alert('Errore nel salvataggio giustificazione');
      } catch { alert('Errore di rete'); }
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="bg-bg-card border border-border-gold rounded-lg p-2.5 text-center">
          <div className="font-rajdhani text-[22px] font-bold text-cr-gold leading-none">{participated}/{total}</div>
          <div className="text-[10px] text-[#8888a8] mt-[3px] uppercase tracking-wider">Partecipati</div>
        </div>
        <div className="bg-bg-card border border-border-gold rounded-lg p-2.5 text-center">
          <div className="font-rajdhani text-[22px] font-bold leading-none" style={{ color: rateColor }}>{rate}%</div>
          <div className="text-[10px] text-[#8888a8] mt-[3px] uppercase tracking-wider">% Presenti</div>
        </div>
        <div className="bg-bg-card border border-border-gold rounded-lg p-2.5 text-center">
          <div className="font-rajdhani text-[22px] font-bold text-[#f87171] leading-none">{badCount}</div>
          <div className="text-[10px] text-[#8888a8] mt-[3px] uppercase tracking-wider">Assenti</div>
        </div>
        <div className="bg-bg-card border border-border-gold rounded-lg p-2.5 text-center">
          <div className="font-rajdhani text-[18px] font-bold text-cr-gold leading-none pt-1">{totalMedals.toLocaleString()}</div>
          <div className="text-[10px] text-[#8888a8] mt-[3px] uppercase tracking-wider">Medaglie tot</div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2.5 mb-3.5">
        <div>
          <div className="font-rajdhani text-[21px] font-bold">Giorno {data.battleDay} ({data.periodType === 'training' ? 'Allenamento' : data.periodType === 'colosseum' ? 'Colosseo' : 'Combattimento'})</div>
          <div className="text-[12px] text-[#8888a8] mt-px">📅 Aggiornato: {data.timestamp ? format(new Date(data.timestamp), 'dd MMM HH:mm', { locale: it }) : ''}</div>
        </div>
        <div>
          <span className="badge bg-[rgba(37,99,235,0.15)] border-[rgba(37,99,235,0.4)] text-[#60a5fa]">🔥 LIVE</span>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full border-collapse min-w-[540px]">
            <thead>
              <tr>
                <th className="bg-[rgba(240,192,48,0.07)] text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-left border-b border-border-gold">#</th>
                <th className="bg-[rgba(240,192,48,0.07)] text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-left border-b border-border-gold">Giocatore</th>
                <th className="bg-[rgba(240,192,48,0.07)] text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-left border-b border-border-gold">🏅 Medaglie</th>
                <th className="bg-[rgba(240,192,48,0.07)] text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-left border-b border-border-gold">Oggi</th>
                <th className="bg-[rgba(240,192,48,0.07)] text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-left border-b border-border-gold">Totali in settimana</th>
                <th className="bg-[rgba(240,192,48,0.07)] text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-left border-b border-border-gold">Stato</th>
                <th className="bg-[rgba(240,192,48,0.07)] text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-left border-b border-border-gold">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => {
                const isBad = p.status === 'absent' || p.status === 'pending';
                const isPartial = p.status === 'partial';
                
                let badgeLabel = '—';
                let badgeClass = '';
                
                if (p.status === 'ok') { badgeLabel = '✅ OK'; badgeClass = 'bg-[rgba(22,163,74,0.15)] border-[rgba(22,163,74,0.4)] text-[#4ade80]'; }
                else if (p.status === 'partial') { badgeLabel = '⚠️ Parziale'; badgeClass = 'bg-[rgba(234,88,12,0.15)] border-[rgba(234,88,12,0.4)] text-[#fb923c]'; }
                else if (p.status === 'absent') { badgeLabel = '❌ Assente'; badgeClass = 'bg-[rgba(220,38,38,0.15)] border-[rgba(220,38,38,0.5)] text-[#f87171] animate-[pulse-r_2s_ease-in-out_infinite]'; }
                else if (p.status === 'pending') { badgeLabel = '⏳ In attesa'; badgeClass = 'bg-[rgba(234,88,12,0.15)] border-[rgba(234,88,12,0.4)] text-[#fb923c]'; }
                else if (p.status === 'excused') { badgeLabel = '🔔 Giustificato'; badgeClass = 'bg-[rgba(217,119,6,0.15)] border-[rgba(217,119,6,0.4)] text-[#fbbf24]'; }

                return (
                  <tr key={p.tag} className={`border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(240,192,48,0.04)] transition-colors ${isBad ? 'bg-[rgba(220,38,38,0.05)] hover:bg-[rgba(220,38,38,0.09)]' : ''}`}>
                    <td className="px-3 py-2.5 font-rajdhani font-bold text-[#8888a8] text-[14px]">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-[13px]">{p.name}</div>
                      <div className="text-[10px] text-[#444466] font-mono">{p.tag}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-rajdhani text-[16px] font-bold text-cr-gold">{p.medals}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-[3px]">
                        {[0,1,2,3].map(dot => (
                          <div key={dot} className={`w-[9px] h-[9px] rounded-full ${dot < p.decksUsedToday ? 'bg-cr-green' : 'bg-[#444466]'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-rajdhani font-bold text-[14px] text-cr-gold">{p.decksUsedTotal || p.decksUsedToday || 0} <span className="text-[10px] font-sans text-[#8888a8] font-normal">mazzi</span></div>
                      {p.missedDaysBreakdown && p.missedDaysBreakdown.length > 0 && (
                        <div className="text-[10px] text-red-400 mt-[2px] leading-tight flex flex-col gap-0.5">
                          {p.missedDaysBreakdown.map((mb: any) => (
                            <span key={mb.day}>Giorno {mb.day}: saltat{mb.missed === 1 ? 'o' : 'i'} {mb.missed} mazz{mb.missed === 1 ? 'o' : 'i'}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
                      {p.excuseReason && (
                        <div className="text-[10px] text-[#8888a8] mt-0.5">📝 {p.excuseReason.substring(0,25)}{p.excuseReason.length > 25 ? '...' : ''}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => handleExcuse(p.tag, p.name, p.status)} className="btn btn-ghost btn-sm px-2 py-1 text-[11px]" title={p.status === "excused" ? "Rimuovi giustificazione" : "Giustifica per oggi"}>
                        🔔
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
