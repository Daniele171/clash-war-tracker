'use client';

import { useState, useEffect } from 'react';

interface PlayerModalProps {
  tag: string;
  onClose: () => void;
}

export default function PlayerModal({ tag, onClose }: PlayerModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

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
  }, [tag]);

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(8,8,21,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[480px] max-h-[90vh] overflow-y-auto rounded-2xl border border-[rgba(240,192,48,0.4)] bg-[rgba(12,12,28,0.98)] shadow-[0_0_60px_rgba(240,192,48,0.15)] animate-[welcomeIn_0.3s_cubic-bezier(0.34,1.3,0.64,1)_both]"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-[rgba(240,192,48,0.7)] to-transparent" />
        
        {/* Close btn */}
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
              <div className="text-[13px] text-[#8888a8]">Caricamento profilo Clash Royale...</div>
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <div className="text-4xl mb-4">🚨</div>
              <div className="text-red-400 font-bold mb-2">Errore API</div>
              <div className="text-[13px] text-[#8888a8]">{error}</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-gold">
                <div className="w-16 h-16 shrink-0 rounded-xl bg-gradient-to-br from-cr-yellow to-cr-gold flex items-center justify-center shadow-[0_0_20px_rgba(240,192,48,0.3)]">
                  <span className="text-[28px] font-bold text-[#1a0a00] font-rajdhani">{data.expLevel || '?'}</span>
                </div>
                <div>
                  <div className="font-rajdhani text-[24px] font-bold text-white leading-tight">{data.name}</div>
                  <div className="text-[12px] text-cr-gold font-mono">{data.tag}</div>
                  <div className="text-[11px] text-[#8888a8] uppercase tracking-wider mt-1">{data.role}</div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-bg-card rounded-xl p-3 border border-border-gold">
                  <div className="text-[10px] text-[#8888a8] uppercase tracking-wider mb-1">Trofei</div>
                  <div className="font-rajdhani text-[20px] font-bold text-white flex items-center gap-1.5">
                    🏆 {data.trophies?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="bg-bg-card rounded-xl p-3 border border-border-gold">
                  <div className="text-[10px] text-[#8888a8] uppercase tracking-wider mb-1">Record Trofei</div>
                  <div className="font-rajdhani text-[20px] font-bold text-white flex items-center gap-1.5">
                    ⭐ {data.bestTrophies?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="bg-bg-card rounded-xl p-3 border border-border-gold col-span-2 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#8888a8] uppercase tracking-wider mb-1">Arena Attuale</div>
                    <div className="font-rajdhani text-[18px] font-bold text-cr-gold">{data.arena || 'Sconosciuta'}</div>
                  </div>
                  <div className="text-3xl opacity-50">🏟️</div>
                </div>
                <div className="bg-bg-card rounded-xl p-3 border border-border-gold">
                  <div className="text-[10px] text-[#8888a8] uppercase tracking-wider mb-1">Carte Sbloccate</div>
                  <div className="font-rajdhani text-[20px] font-bold text-white">{data.cards} </div>
                </div>
                <div className="bg-bg-card rounded-xl p-3 border border-border-gold">
                  <div className="text-[10px] text-[#8888a8] uppercase tracking-wider mb-1">Vittorie War</div>
                  <div className="font-rajdhani text-[20px] font-bold text-white flex items-center gap-1.5">
                    ⚔️ {data.warDayWins?.toLocaleString() || 0}
                  </div>
                </div>
              </div>

              {/* Donations */}
              <div className="bg-[rgba(22,163,74,0.05)] border border-[rgba(22,163,74,0.2)] rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-[#4ade80] uppercase tracking-wider mb-1">Donazioni Settimana</div>
                  <div className="font-rajdhani text-[18px] font-bold text-white">
                    <span className="text-[#4ade80]">↑ {data.donations || 0}</span>
                    <span className="text-[#8888a8] mx-2">|</span>
                    <span className="text-red-400">↓ {data.donationsReceived || 0}</span>
                  </div>
                </div>
                <div className="text-2xl">🎁</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
