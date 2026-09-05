'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function WarTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Load current user info
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.username) setCurrentUsername(d.username.toLowerCase());
      if (d.role === 'admin') setIsAdmin(true);
    }).catch(() => {});

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

  // Check if a participant name matches the current logged-in user
  const isCurrentUser = (name: string) => {
    if (!currentUsername) return false;
    return name.toLowerCase().includes(currentUsername) || currentUsername.includes(name.toLowerCase());
  };

  if (loading) return (
    <div className="text-center py-20">
      <div className="inline-block w-8 h-8 border-2 border-cr-gold border-t-transparent rounded-full animate-spin mb-4" />
      <div className="text-[#8888a8] text-[13px]">Caricamento guerra...</div>
    </div>
  );

  if (data?.error) return (
    <div className="text-center py-12 px-6 bg-[rgba(220,38,38,0.1)] border border-red-500 rounded-xl">
      <div className="text-[48px] mb-4 block">🚨</div>
      <div className="font-rajdhani text-[20px] font-bold text-red-400 mb-2">Errore di Sistema</div>
      <div className="text-[13px] text-red-300 mb-4">{data.error}</div>
      <div className="text-[12px] text-[#8888a8]">
        Controlla le variabili d&apos;ambiente su Vercel.
      </div>
    </div>
  );

  if (!data || data.status) return (
    <div className="text-center py-16 px-6 text-[#8888a8]">
      <div className="relative inline-block mb-6">
        <span className="text-[64px] opacity-30 block animate-[float_3s_ease-in-out_infinite]">🏁</span>
        <div className="absolute inset-0 bg-gradient-radial from-cr-gold/5 to-transparent rounded-full" />
      </div>
      <div className="font-rajdhani text-[22px] font-bold text-[#f0f0ff] mb-2">Nessuna War Attiva</div>
      <div className="text-[13px] leading-relaxed">
        {isAdmin
          ? <>Premi il bottone 🔄 in alto a destra per sincronizzare da Clash Royale.</>
          : <>La guerra non è ancora iniziata o i dati non sono stati sincronizzati.</>
        }
      </div>
    </div>
  );

  const participants = data.participants || [];
  const total = participants.length;
  const participated = participants.filter((p: any) => p.decksUsedToday > 0).length;
  const badCount = participants.filter((p: any) => p.status === 'absent').length;
  const totalMedals = participants.reduce((sum: number, p: any) => sum + (p.medals || 0), 0);
  const rate = total > 0 ? Math.round((participated / total) * 100) : 0;
  const rateColor = rate >= 80 ? '#4ade80' : rate >= 50 ? '#fb923c' : '#f87171';

  const sorted = [...participants].sort((a: any, b: any) => {
    // Always put current user first
    if (isCurrentUser(a.name) && !isCurrentUser(b.name)) return -1;
    if (!isCurrentUser(a.name) && isCurrentUser(b.name)) return 1;
    // Then sort by status priority (absent first for admins, ok first for members)
    const statusOrder = { absent: 0, partial: 1, pending: 2, ok: 3, excused: 4 };
    const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
    const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (b.medals || 0) - (a.medals || 0);
  });

  const handleExcuse = async (tag: string, name: string, status: string) => {
    if (!isAdmin) return; // Only admins can excuse
    if (status === 'excused') {
      if (!confirm(`Rimuovere la giustificazione di ${name}?`)) return;
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
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {[
          { value: `${participated}/${total}`, label: 'Partecipati', color: 'text-cr-gold' },
          { value: `${rate}%`, label: '% Presenti', color: rateColor },
          { value: badCount, label: 'Assenti', color: '#f87171' },
          { value: totalMedals.toLocaleString(), label: 'Medaglie tot', color: 'text-cr-gold', small: true },
        ].map((stat, i) => (
          <div key={i} className="bg-bg-card border border-border-gold rounded-xl p-3 text-center hover:border-[rgba(240,192,48,0.5)] transition-colors">
            <div
              className={`font-rajdhani font-bold leading-none ${stat.small ? 'text-[18px]' : 'text-[24px]'}`}
              style={{ color: typeof stat.color === 'string' && stat.color.startsWith('#') ? stat.color : undefined }}
            >
              <span className={typeof stat.color === 'string' && !stat.color.startsWith('#') ? stat.color : ''}>
                {stat.value}
              </span>
            </div>
            <div className="text-[10px] text-[#8888a8] mt-1 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* War day header */}
      <div className="flex items-center justify-between flex-wrap gap-2.5 mb-3.5">
        <div>
          <div className="font-rajdhani text-[21px] font-bold">
            Giorno {data.battleDay} ({data.periodType === 'training' ? 'Allenamento' : data.periodType === 'colosseum' ? 'Colosseo' : 'Combattimento'})
          </div>
          <div className="text-[12px] text-[#8888a8] mt-px">
            📅 Aggiornato: {data.timestamp ? format(new Date(data.timestamp), 'dd MMM HH:mm', { locale: it }) : '—'}
          </div>
        </div>
        <span className="badge bg-[rgba(37,99,235,0.15)] border-[rgba(37,99,235,0.4)] text-[#60a5fa] animate-pulse">🔥 LIVE</span>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[520px]">
            <thead>
              <tr>
                {['#', 'Giocatore', '🏅 Medaglie', 'Mazzi oggi', 'Tot. settimana', 'Stato', ...(isAdmin ? ['Azioni'] : [])].map(h => (
                  <th key={h} className="bg-[rgba(240,192,48,0.07)] text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-left border-b border-border-gold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p: any, i: number) => {
                const isMe = isCurrentUser(p.name);
                const isBad = p.status === 'absent';
                const isPartial = p.status === 'partial';

                let badgeLabel = '—';
                let badgeClass = '';
                if (p.status === 'ok') { badgeLabel = '✅ OK'; badgeClass = 'bg-[rgba(22,163,74,0.15)] border-[rgba(22,163,74,0.4)] text-[#4ade80]'; }
                else if (p.status === 'partial') { badgeLabel = '⚠️ Parziale'; badgeClass = 'bg-[rgba(234,88,12,0.15)] border-[rgba(234,88,12,0.4)] text-[#fb923c]'; }
                else if (p.status === 'absent') { badgeLabel = '❌ Assente'; badgeClass = 'bg-[rgba(220,38,38,0.15)] border-[rgba(220,38,38,0.5)] text-[#f87171] animate-[pulse-r_2s_ease-in-out_infinite]'; }
                else if (p.status === 'pending') { badgeLabel = '⏳ In attesa'; badgeClass = 'bg-[rgba(234,88,12,0.15)] border-[rgba(234,88,12,0.4)] text-[#fb923c]'; }
                else if (p.status === 'excused') { badgeLabel = '🔔 Giustificato'; badgeClass = 'bg-[rgba(217,119,6,0.15)] border-[rgba(217,119,6,0.4)] text-[#fbbf24]'; }

                return (
                  <tr
                    key={p.tag}
                    className={`border-b border-[rgba(255,255,255,0.04)] transition-colors
                      ${isMe
                        ? 'bg-[rgba(240,192,48,0.09)] hover:bg-[rgba(240,192,48,0.14)] shadow-[inset_0_0_0_1px_rgba(240,192,48,0.25)]'
                        : isBad
                          ? 'bg-[rgba(220,38,38,0.05)] hover:bg-[rgba(220,38,38,0.09)]'
                          : 'hover:bg-[rgba(240,192,48,0.04)]'
                      }`}
                  >
                    <td className="px-3 py-2.5 font-rajdhani font-bold text-[#8888a8] text-[14px]">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {isMe && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cr-gold text-[#080815] font-bold uppercase tracking-wider animate-[pulse_2s_ease-in-out_infinite]">
                            Tu
                          </span>
                        )}
                        <div>
                          <div className={`font-semibold text-[13px] ${isMe ? 'text-cr-gold' : ''}`}>{p.name}</div>
                          <div className="text-[10px] text-[#444466] font-mono">{p.tag}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`font-rajdhani text-[16px] font-bold ${isMe ? 'text-cr-gold' : 'text-cr-gold'}`}>{p.medals}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-[3px]">
                        {[0, 1, 2, 3].map(dot => (
                          <div
                            key={dot}
                            className={`w-[9px] h-[9px] rounded-full transition-all ${dot < p.decksUsedToday
                              ? (isMe ? 'bg-cr-gold shadow-[0_0_4px_rgba(240,192,48,0.6)]' : 'bg-cr-green')
                              : 'bg-[#444466]'}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-rajdhani font-bold text-[14px] text-cr-gold">
                        {p.decksUsedTotal || p.decksUsedToday || 0}{' '}
                        <span className="text-[10px] font-sans text-[#8888a8] font-normal">mazzi</span>
                      </div>
                      {p.missedDaysBreakdown && p.missedDaysBreakdown.length > 0 && (
                        <div className="text-[10px] text-red-400 mt-[2px] leading-tight flex flex-col gap-0.5">
                          {p.missedDaysBreakdown.map((mb: any) => (
                            <span key={mb.day}>
                              Giorno {mb.day}: {mb.missed} mazzo{mb.missed > 1 ? 'i' : ''} saltato{mb.missed > 1 ? 'i' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
                      {p.excuseReason && (
                        <div className="text-[10px] text-[#8888a8] mt-0.5">📝 {p.excuseReason.substring(0, 25)}{p.excuseReason.length > 25 ? '...' : ''}</div>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => handleExcuse(p.tag, p.name, p.status)}
                          className="btn btn-ghost btn-sm px-2 py-1 text-[11px]"
                          title={p.status === 'excused' ? 'Rimuovi giustificazione' : 'Giustifica per oggi'}
                        >
                          🔔
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Personal callout for non-admin members */}
      {!isAdmin && currentUsername && (
        <div className="mt-4 p-3 rounded-xl border border-[rgba(240,192,48,0.3)] bg-[rgba(240,192,48,0.05)] text-[12px] text-[#8888a8] text-center">
          👆 La tua riga è evidenziata in oro. Hai usato{' '}
          <strong className="text-cr-gold">
            {sorted.find((p: any) => isCurrentUser(p.name))?.decksUsedTotal || 0} mazzi
          </strong>{' '}
          questa settimana.
        </div>
      )}
    </>
  );
}
