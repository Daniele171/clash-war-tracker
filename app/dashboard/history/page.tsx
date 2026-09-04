'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function HistoryTab() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(d => {
        setHistory(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-20 text-[#8888a8]">Caricamento...</div>;
  if ((history as any).error) return <div className="text-red-400 p-4">Errore: {(history as any).error}</div>;
  if (history.length === 0) return (
    <div className="text-center py-12 px-6 text-[#8888a8]">
      <div className="text-[48px] mb-4 opacity-50 block">📊</div>
      <div className="font-rajdhani text-[20px] font-bold text-[#f0f0ff] mb-2">Nessuno storico trovato</div>
      <div className="text-[13px]">Lo storico si popola alla fine di ogni settimana di war.</div>
    </div>
  );

  return (
    <>
      <div className="font-rajdhani text-[17px] font-bold text-cr-gold mb-3 flex items-center gap-2">
        📅 Registro War Passate
      </div>
      <div className="flex flex-col gap-2.5">
        {history.map((war) => {
          const key = `${war.seasonId}-${war.sectionIndex}`;
          const isOpen = expanded === key;

          // Separate played vs absent
          const played = (war.clan.participants || []).filter((p: any) => p.decksUsed > 0);
          const absent = (war.clan.participants || []).filter((p: any) => p.decksUsed === 0);
          const lazyCount = played.filter((p: any) => p.decksUsed < 16).length + absent.length;

          // Sort played by decksUsed desc, then medals desc
          const sortedPlayed = [...played].sort((a: any, b: any) => {
            if (b.decksUsed !== a.decksUsed) return b.decksUsed - a.decksUsed;
            return b.medals - a.medals;
          });

          return (
            <div key={key} className="bg-bg-card border border-border-gold rounded-xl overflow-hidden hover:border-[rgba(240,192,48,0.5)] transition-colors">
              {/* Header — clickable to expand */}
              <button
                onClick={() => setExpanded(isOpen ? null : key)}
                className="w-full flex items-center justify-between p-3.5 text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-rajdhani text-[18px] font-bold">
                      Stagione {war.seasonId} — Settimana {war.sectionIndex + 1}
                    </div>
                    {war.isColosseum && (
                      <span className="badge bg-[rgba(168,85,247,0.15)] border-[rgba(168,85,247,0.4)] text-[#c084fc] text-[9px]">
                        🏛️ Colosseo
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#8888a8] mt-0.5 flex items-center gap-3">
                    <span>📅 {format(new Date(war.createdDate.replace('T', ' ').replace('.000Z', '')), 'dd MMM yyyy', { locale: it })}</span>
                    {war.rank && <span>🏆 #{war.rank} posto</span>}
                    {war.trophyChange != null && (
                      <span className={war.trophyChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {war.trophyChange >= 0 ? '+' : ''}{war.trophyChange} trofei
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="font-rajdhani text-[16px] font-bold text-cr-gold">🏅 {war.clan.fame.toLocaleString()}</span>
                  {lazyCount > 0 && (
                    <span className="badge bg-[rgba(220,38,38,0.15)] border-[rgba(220,38,38,0.4)] text-[#f87171]">
                      ⚠️ {lazyCount}
                    </span>
                  )}
                  <span className="text-[#8888a8] text-[16px]">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-border-gold">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[420px]">
                      <thead>
                        <tr>
                          <th className="bg-[rgba(240,192,48,0.07)] text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-left">#</th>
                          <th className="bg-[rgba(240,192,48,0.07)] text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-left">Giocatore</th>
                          <th className="bg-[rgba(240,192,48,0.07)] text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-left">🏅 Medaglie</th>
                          <th className="bg-[rgba(240,192,48,0.07)] text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-left">Attacchi</th>
                          <th className="bg-[rgba(240,192,48,0.07)] text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-left">Voto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPlayed.map((p: any, i: number) => {
                          const isLazy = p.decksUsed < 16;
                          return (
                            <tr key={p.tag} className={`border-b border-[rgba(255,255,255,0.04)] ${isLazy ? 'bg-[rgba(234,88,12,0.05)]' : ''}`}>
                              <td className="px-3 py-2 font-rajdhani font-bold text-[#8888a8] text-[13px]">{i + 1}</td>
                              <td className="px-3 py-2">
                                <div className="font-semibold text-[13px]">{p.name}</div>
                                <div className="text-[10px] text-[#444466] font-mono">{p.tag}</div>
                              </td>
                              <td className="px-3 py-2 font-rajdhani font-bold text-[15px] text-cr-gold">{(p.medals || 0).toLocaleString()}</td>
                              <td className="px-3 py-2">
                                <div className="font-rajdhani font-bold text-[14px]">
                                  {p.decksUsed}
                                  <span className="text-[10px] text-[#8888a8] font-sans font-normal"> / 16 atk</span>
                                </div>
                                <div className="flex gap-[2px] mt-1">
                                  {[...Array(16)].map((_, d) => (
                                    <div key={d} className={`w-[5px] h-[5px] rounded-full ${d < p.decksUsed ? 'bg-cr-green' : 'bg-[#333355]'}`} />
                                  ))}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                {p.decksUsed >= 16
                                  ? <span className="badge bg-[rgba(22,163,74,0.15)] border-[rgba(22,163,74,0.4)] text-[#4ade80]">✅ Completo</span>
                                  : <span className="badge bg-[rgba(234,88,12,0.15)] border-[rgba(234,88,12,0.4)] text-[#fb923c]">⚠️ Parziale</span>
                                }
                              </td>
                            </tr>
                          );
                        })}
                        {/* Absent members */}
                        {absent.map((p: any) => (
                          <tr key={p.tag} className="border-b border-[rgba(255,255,255,0.04)] bg-[rgba(220,38,38,0.07)]">
                            <td className="px-3 py-2 font-rajdhani font-bold text-[#8888a8] text-[13px]">—</td>
                            <td className="px-3 py-2">
                              <div className="font-semibold text-[13px] opacity-70">{p.name}</div>
                              <div className="text-[10px] text-[#444466] font-mono">{p.tag}</div>
                            </td>
                            <td className="px-3 py-2 font-rajdhani font-bold text-[15px] text-[#8888a8]">0</td>
                            <td className="px-3 py-2">
                              <div className="font-rajdhani font-bold text-[14px] text-[#8888a8]">0 / 16 atk</div>
                              <div className="flex gap-[2px] mt-1">
                                {[...Array(16)].map((_, d) => (
                                  <div key={d} className="w-[5px] h-[5px] rounded-full bg-[#333355]" />
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span className="badge bg-[rgba(220,38,38,0.15)] border-[rgba(220,38,38,0.4)] text-[#f87171]">❌ Assente</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
