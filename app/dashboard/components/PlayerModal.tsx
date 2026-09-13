'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';

interface PlayerModalProps {
  tag: string;
  onClose: () => void;
}

export default function PlayerModal({ tag, onClose }: PlayerModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Lock/unlock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  // Fetch player data + history in parallel
  useEffect(() => {
    setLoading(true);
    fetch(`/api/player?tag=${encodeURIComponent(tag)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    setHistoryLoading(true);
    fetch('/api/history')
      .then(r => r.json())
      .then(hData => {
        if (!Array.isArray(hData)) return;
        // Sort oldest first, take last 10
        const sorted = [...hData].reverse().slice(-10);
        const chartData = sorted.map((war, i) => {
          const participant = war.clan?.participants?.find((p: any) => p.tag === tag);
          return { name: `War ${i + 1}`, medals: participant?.medals ?? 0 };
        });
        setHistoryData(chartData);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [tag]);

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(8,8,21,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] max-h-[90vh] overflow-y-auto rounded-2xl border border-[rgba(240,192,48,0.4)] bg-[rgba(12,12,28,0.98)] shadow-[0_0_60px_rgba(240,192,48,0.15)] animate-bounceIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Top decorative line */}
        <div className="absolute top-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-[rgba(240,192,48,0.7)] to-transparent" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors text-[#8888a8] hover:text-white"
        >
          ✕
        </button>

        <div className="p-6">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-2 border-cr-gold border-t-transparent rounded-full animate-spin mb-4" />
              <div className="text-[13px] text-[#8888a8]">Caricamento profilo...</div>
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <div className="text-4xl mb-4">🚨</div>
              <div className="text-red-400 font-bold mb-2">Errore API</div>
              <div className="text-[13px] text-[#8888a8]">{error}</div>
            </div>
          ) : data ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-gold">
                <div className="w-16 h-16 shrink-0 rounded-xl bg-gradient-to-br from-cr-yellow to-cr-gold flex items-center justify-center shadow-[0_0_20px_rgba(240,192,48,0.3)]">
                  <span className="text-[28px] font-bold text-[#1a0a00] font-rajdhani">{data.expLevel ?? '?'}</span>
                </div>
                <div>
                  <div className="font-rajdhani text-[22px] font-bold text-white leading-tight flex items-center gap-2 flex-wrap">
                    {data.name}
                    {data.name === 'NobunagaYT' && (
                      <span className="text-[10px] bg-[rgba(240,192,48,0.2)] border border-[rgba(240,192,48,0.5)] text-cr-gold px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                        👑 DEV
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-cr-gold font-mono">{data.tag}</div>
                  <div className="text-[11px] text-[#8888a8] uppercase tracking-wider mt-0.5">{data.role ?? ''}</div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-bg-card rounded-xl p-3 border border-border-gold">
                  <div className="text-[10px] text-[#8888a8] uppercase tracking-wider mb-1">Trofei</div>
                  <div className="font-rajdhani text-[20px] font-bold text-white">🏆 {data.trophies?.toLocaleString() ?? 0}</div>
                </div>
                <div className="bg-bg-card rounded-xl p-3 border border-border-gold">
                  <div className="text-[10px] text-[#8888a8] uppercase tracking-wider mb-1">Record Trofei</div>
                  <div className="font-rajdhani text-[20px] font-bold text-white">⭐ {data.bestTrophies?.toLocaleString() ?? 0}</div>
                </div>
                <div className="bg-bg-card rounded-xl p-3 border border-border-gold col-span-2 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#8888a8] uppercase tracking-wider mb-1">Arena Attuale</div>
                    <div className="font-rajdhani text-[18px] font-bold text-cr-gold">{data.arena ?? 'Sconosciuta'}</div>
                  </div>
                  <div className="text-3xl opacity-50">🏟️</div>
                </div>
                <div className="bg-bg-card rounded-xl p-3 border border-border-gold">
                  <div className="text-[10px] text-[#8888a8] uppercase tracking-wider mb-1">Carte Sbloccate</div>
                  <div className="font-rajdhani text-[20px] font-bold text-white">{data.cards ?? 0}</div>
                </div>
                <div className="bg-bg-card rounded-xl p-3 border border-border-gold">
                  <div className="text-[10px] text-[#8888a8] uppercase tracking-wider mb-1">Vittorie War</div>
                  <div className="font-rajdhani text-[20px] font-bold text-white">⚔️ {data.warDayWins?.toLocaleString() ?? 0}</div>
                </div>
              </div>

              {/* Donations */}
              <div className="bg-[rgba(22,163,74,0.05)] border border-[rgba(22,163,74,0.2)] rounded-xl p-4 flex justify-between items-center mb-6">
                <div>
                  <div className="text-[10px] text-[#4ade80] uppercase tracking-wider mb-1">Donazioni Settimana</div>
                  <div className="font-rajdhani text-[18px] font-bold text-white">
                    <span className="text-[#4ade80]">↑ {data.donations ?? 0}</span>
                    <span className="text-[#8888a8] mx-2">|</span>
                    <span className="text-red-400">↓ {data.donationsReceived ?? 0}</span>
                  </div>
                </div>
                <div className="text-2xl">🎁</div>
              </div>

              {/* War Medals History Chart */}
              <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4">
                <div className="text-[10px] text-[#8888a8] uppercase tracking-wider mb-4">Andamento Medaglie (Ultime 10 War)</div>
                {historyLoading ? (
                  <div className="h-[120px] flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-cr-gold border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : historyData.length > 0 ? (
                  <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyData}>
                        <Tooltip
                          contentStyle={{ backgroundColor: 'rgba(12,12,28,0.9)', border: '1px solid rgba(240,192,48,0.3)', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: '#f0c030', fontWeight: 'bold' }}
                          labelStyle={{ color: '#8888a8', marginBottom: '4px' }}
                        />
                        <Line type="monotone" dataKey="medals" name="Medaglie" stroke="#f0c030" strokeWidth={3} dot={{ fill: '#f0c030', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#fff' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[120px] flex items-center justify-center text-[12px] text-[#555575]">
                    Nessun dato storico disponibile
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
