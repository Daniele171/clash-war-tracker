'use client';

import { useEffect, useState } from 'react';

export default function LeaderboardPage() {
  const [stats, setStats] = useState<any[]>([]);
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/top-decks').then(r => r.json())
    ]).then(([statsData, decksData]) => {
      if (statsData?.stats) {
        setStats(statsData.stats.sort((a: any, b: any) => b.perfectDays - a.perfectDays || b.totalDecksUsed - a.totalDecksUsed));
      }
      if (decksData?.decks) setDecks(decksData.decks);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center p-10 text-white/50">Caricamento Classifiche...</div>;

  const wallOfFame = stats.filter(s => s.perfectDays > 0).slice(0, 5);
  const wallOfShame = [...stats].sort((a, b) => b.missedAttacks - a.missedAttacks).filter(s => s.missedAttacks > 0).slice(0, 5);

  return (
    <div className="animate-fadeIn p-4 pb-20">
      <h2 className="text-2xl font-rajdhani font-bold text-white uppercase tracking-wider mb-6">Classifiche & Mazzi 🏆</h2>
      
      {/* Wall of Fame */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-cr-gold mb-3 flex items-center gap-2"><span className="text-2xl">🏅</span> Wall of Fame</h3>
        <p className="text-xs text-[#8888a8] mb-4">I migliori giocatori per costanza e partecipazione (Statistiche storiche)</p>
        <div className="flex flex-col gap-3">
          {wallOfFame.length === 0 ? <p className="text-white/40 italic">Non ci sono ancora dati sufficienti.</p> : 
            wallOfFame.map((s, i) => (
              <div key={s.tag} className="bg-black/40 border border-green-500/20 p-3 rounded-xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-white/30">#{i+1}</span>
                  <span className="font-bold text-white">{s.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">{s.perfectDays} 🌟</div>
                  <div className="text-[10px] text-white/50 uppercase">giorni perfetti</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Wall of Shame */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-red-500 mb-3 flex items-center gap-2"><span className="text-2xl">🍅</span> Wall of Shame</h3>
        <p className="text-xs text-[#8888a8] mb-4">I giocatori che saltano più attacchi in assoluto</p>
        <div className="flex flex-col gap-3">
          {wallOfShame.length === 0 ? <p className="text-white/40 italic">Tutti perfetti per ora!</p> : 
            wallOfShame.map((s, i) => (
              <div key={s.tag} className="bg-black/40 border border-red-500/20 p-3 rounded-xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">{s.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-bold">{s.missedAttacks} ❌</div>
                  <div className="text-[10px] text-white/50 uppercase">attacchi persi</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Top Decks */}
      <div>
        <h3 className="text-xl font-bold text-[#c8c8e0] mb-3 flex items-center gap-2"><span className="text-2xl">🃏</span> Migliori Mazzi</h3>
        <div className="bg-yellow-900/20 border border-yellow-500/30 p-3 rounded-xl mb-4">
          <p className="text-xs text-yellow-200">⚠️ <strong>Nota:</strong> I mazzi mostrati sono estratti dallo storico dei nostri migliori giocatori. Per non sovraccaricare i server, questa lista viene aggiornata ogni 4 ore e non è in tempo reale.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {decks.length === 0 ? <p className="text-white/40 italic">Nessun mazzo trovato al momento.</p> : 
            decks.map((deck, i) => (
              <div key={i} className="bg-black/40 border border-white/5 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-[#8888a8]">Usato da: <strong className="text-cr-gold">{deck.player}</strong></span>
                  <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded-full">Vittoria in Guerra</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {deck.cards.map((card: any) => (
                    <div key={card.id} className="relative aspect-[3/4] bg-black/60 rounded-lg overflow-hidden border border-white/10">
                      <img src={card.iconUrls.medium} alt={card.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
