'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import PlayerModal from './components/PlayerModal';

export default function WarTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  useEffect(() => {
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

  const isCurrentUser = (name: string) => {
    if (!currentUsername) return false;
    return name.toLowerCase().includes(currentUsername) || currentUsername.includes(name.toLowerCase());
  };

  if (loading) return (
    <div className="text-center py-20 animate-fadeIn">
      <div className="inline-block w-8 h-8 border-2 border-cr-gold border-t-transparent rounded-full animate-spin mb-4" />
      <div className="text-[#8888a8] text-[13px] tracking-wide uppercase">Caricamento war...</div>
    </div>
  );

  if (data?.error) return (
    <div className="text-center py-12 px-6 bg-[rgba(220,38,38,0.1)] border border-red-500 rounded-xl animate-[fadeUp_0.4s_ease]">
      <div className="text-[48px] mb-4 block">🚨</div>
      <div className="font-rajdhani text-[20px] font-bold text-red-400 mb-2">Errore di Sistema</div>
      <div className="text-[13px] text-red-300 mb-4">{data.error}</div>
    </div>
  );

  if (!data || data.status) return (
    <div className="text-center py-16 px-6 text-[#8888a8] animate-[fadeUp_0.4s_ease]">
      <div className="relative inline-block mb-6">
        <span className="text-[64px] opacity-30 block animate-[float_3s_ease-in-out_infinite]">🏁</span>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(240,192,48,0.1)_0%,transparent_70%)] rounded-full" />
      </div>
      <div className="font-rajdhani text-[22px] font-bold text-[#f0f0ff] mb-2">Nessuna War Attiva</div>
      <div className="text-[13px] leading-relaxed">La guerra non è ancora iniziata o i dati non sono stati sincronizzati.</div>
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
    if (isCurrentUser(a.name) && !isCurrentUser(b.name)) return -1;
    if (!isCurrentUser(a.name) && isCurrentUser(b.name)) return 1;
    const statusOrder = { absent: 0, partial: 1, pending: 2, ok: 3, excused: 4 };
    const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
    const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (b.medals || 0) - (a.medals || 0);
  });

  const missingDecksPlayers = sorted.filter(p => p.status === 'absent' || p.status === 'partial');

  const handleExcuse = async (e: React.MouseEvent, tag: string, name: string, status: string) => {
    e.stopPropagation(); // prevent row click
    if (!isAdmin) return;
    if (status === 'excused') {
      if (!confirm(`Rimuovere la giustificazione di ${name}?`)) return;
      try {
        await fetch('/api/excuse', { method: 'DELETE', body: JSON.stringify({ tag }) });
        window.location.reload();
      } catch {}
    } else {
      const reason = prompt(`Giustifica ${name} per OGGI:`);
      if (reason === null) return;
      try {
        await fetch('/api/excuse', { method: 'POST', body: JSON.stringify({ tag, reason: reason || 'Giustificato' }) });
        window.location.reload();
      } catch {}
    }
  };

  const renderDeckDots = (used: number) => {
    return (
      <div className="flex gap-[3px]">
        {[0, 1, 2, 3].map(dot => {
          const isUsed = dot < used;
          return (
            <div
              key={dot}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isUsed 
                ? 'bg-cr-green shadow-[0_0_5px_rgba(22,163,74,0.4)] scale-100' 
                : 'bg-cr-red shadow-[0_0_5px_rgba(220,38,38,0.4)] scale-90 opacity-60'}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="animate-[fadeUp_0.3s_ease]">
      {selectedPlayer && (
        <PlayerModal tag={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
        {[
          { value: `${participated}/${total}`, label: 'Partecipati', color: 'text-cr-gold' },
          { value: `${rate}%`, label: '% Presenti', color: rateColor },
          { value: badCount, label: 'Assenti', color: '#f87171' },
          { value: totalMedals.toLocaleString(), label: 'Medaglie tot', color: 'text-cr-gold' },
        ].map((stat, i) => (
          <div key={i} className="stat-card bg-[rgba(255,255,255,0.03)] border border-[rgba(240,192,48,0.1)] rounded-xl p-3.5 text-center cursor-default" style={{ animationDelay: `${i * 0.1}s` }}>
            <div
              className="font-rajdhani font-bold text-[26px] leading-none mb-1"
              style={{ color: typeof stat.color === 'string' && stat.color.startsWith('#') ? stat.color : undefined }}
            >
              <span className={typeof stat.color === 'string' && !stat.color.startsWith('#') ? stat.color : ''}>
                {stat.value}
              </span>
            </div>
            <div className="text-[10px] text-[#8888a8] uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Missing Decks Highlight (if any) */}
      {missingDecksPlayers.length > 0 && (
        <div className="mb-6 rounded-xl border border-[rgba(234,88,12,0.3)] bg-[rgba(234,88,12,0.05)] overflow-hidden animate-[slideUp_0.4s_ease]">
          <div className="bg-[rgba(234,88,12,0.15)] px-4 py-2.5 flex items-center gap-2 border-b border-[rgba(234,88,12,0.2)]">
            <span className="text-xl animate-pulse">⚠️</span>
            <span className="font-rajdhani text-[16px] font-bold text-[#fb923c] uppercase tracking-wide">
              Giocatori Inadempienti ({missingDecksPlayers.length})
            </span>
          </div>
          <div className="p-2 flex flex-col gap-1 max-h-[160px] overflow-y-auto">
            {missingDecksPlayers.map((p, i) => {
              const missing = 4 - p.decksUsedToday;
              return (
                <div 
                  key={`miss-${p.tag}`} 
                  onClick={() => setSelectedPlayer(p.tag)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#f0f0ff]">{p.name}</span>
                    <span className="text-[10px] bg-[rgba(220,38,38,0.2)] text-[#f87171] px-1.5 py-0.5 rounded border border-[rgba(220,38,38,0.3)]">
                      -{missing} {missing === 1 ? 'mazzo' : 'mazzi'}
                    </span>
                  </div>
                  {renderDeckDots(p.decksUsedToday)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* War day header */}
      <div className="flex items-center justify-between flex-wrap gap-2.5 mb-3.5 mt-2">
        <div>
          <div className="font-rajdhani text-[22px] font-bold text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
            Giorno {data.battleDay} ({data.periodType === 'training' ? 'Allenamento' : data.periodType === 'colosseum' ? 'Colosseo' : 'Combattimento'})
          </div>
          <div className="text-[11px] text-[#8888a8] mt-0.5 font-mono">
            Ultimo sync: {data.timestamp ? format(new Date(data.timestamp), 'HH:mm:ss', { locale: it }) : '—'}
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[11px] text-[#8888a8]">Tap sulla riga per i profili</span>
           <span className="badge bg-[rgba(37,99,235,0.15)] border-[rgba(37,99,235,0.4)] text-[#60a5fa] shadow-[0_0_10px_rgba(37,99,235,0.2)] animate-pulse">🔥 LIVE</span>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr>
                {['#', 'Giocatore', '🏅 Medaglie', 'Mazzi oggi', 'Settimana', 'Stato', ...(isAdmin ? ['Azioni'] : [])].map(h => (
                  <th key={h} className="bg-[rgba(240,192,48,0.04)] text-[#8888a8] text-[10px] font-bold uppercase tracking-widest px-3 py-3 text-left border-b border-border-gold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p: any, i: number) => {
                const isMe = isCurrentUser(p.name);
                const isBad = p.status === 'absent';
                
                let badgeLabel = '—';
                let badgeClass = '';
                if (p.status === 'ok') { badgeLabel = '✅ OK'; badgeClass = 'bg-[rgba(22,163,74,0.15)] border-[rgba(22,163,74,0.4)] text-[#4ade80]'; }
                else if (p.status === 'partial') { badgeLabel = '⚠️ Parziale'; badgeClass = 'bg-[rgba(234,88,12,0.15)] border-[rgba(234,88,12,0.4)] text-[#fb923c]'; }
                else if (p.status === 'absent') { badgeLabel = '❌ Assente'; badgeClass = 'bg-[rgba(220,38,38,0.15)] border-[rgba(220,38,38,0.5)] text-[#f87171] shadow-[0_0_10px_rgba(220,38,38,0.2)]'; }
                else if (p.status === 'pending') { badgeLabel = '⏳ Attesa'; badgeClass = 'bg-[rgba(234,88,12,0.15)] border-[rgba(234,88,12,0.4)] text-[#fb923c]'; }
                else if (p.status === 'excused') { badgeLabel = '🔔 Giust.'; badgeClass = 'bg-[rgba(217,119,6,0.15)] border-[rgba(217,119,6,0.4)] text-[#fbbf24]'; }

                return (
                  <tr
                    key={p.tag}
                    onClick={() => setSelectedPlayer(p.tag)}
                    className={`row-animate border-b border-[rgba(255,255,255,0.03)] transition-all cursor-pointer group
                      ${isMe
                        ? 'bg-[rgba(240,192,48,0.08)] hover:bg-[rgba(240,192,48,0.12)] shadow-[inset_0_0_0_1px_rgba(240,192,48,0.3)]'
                        : isBad
                          ? 'bg-[rgba(220,38,38,0.03)] hover:bg-[rgba(220,38,38,0.08)]'
                          : 'hover:bg-[rgba(255,255,255,0.03)] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]'
                      } ${isBad ? 'row-danger' : ''}`}
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <td className="px-3 py-3.5 font-rajdhani font-bold text-[#8888a8] text-[14px] group-hover:text-white transition-colors">{i + 1}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        {isMe && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cr-gold text-[#080815] font-bold uppercase tracking-wider animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(240,192,48,0.6)]">
                            Tu
                          </span>
                        )}
                        <div>
                          <div className={`font-semibold text-[14px] ${isMe ? 'text-cr-gold' : 'group-hover:text-cr-gold transition-colors'}`}>{p.name}</div>
                          <div className="text-[10px] text-[#444466] font-mono group-hover:text-[#666688] transition-colors">{p.tag}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`font-rajdhani text-[18px] font-bold ${isMe ? 'text-cr-gold drop-shadow-glow-gold' : 'text-cr-gold'}`}>{p.medals}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      {renderDeckDots(p.decksUsedToday)}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="font-rajdhani font-bold text-[15px] text-white">
                        {p.decksUsedTotal || p.decksUsedToday || 0}{' '}
                        <span className="text-[10px] font-sans text-[#8888a8] font-normal uppercase">mazzi</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
                      {p.excuseReason && (
                        <div className="text-[10px] text-[#8888a8] mt-1 italic">📝 {p.excuseReason.substring(0, 20)}...</div>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-3.5">
                        <button
                          onClick={(e) => handleExcuse(e, p.tag, p.name, p.status)}
                          className="btn btn-ghost border-transparent hover:border-border-gold-strong btn-sm px-2.5 py-1 text-[12px] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-all"
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
    </div>
  );
}
