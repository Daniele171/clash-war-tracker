'use client';

import { useEffect, useState } from 'react';

export default function RadarPage() {
  const [clans, setClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sync')
      .then(res => res.json())
      .then(() => fetch('/api/wars/live'))
      .then(res => res.json())
      .then(data => {
        if (data && data.clans) {
          // Sort by periodPoints then by fame
          const sortedClans = [...data.clans].sort((a, b) => b.periodPoints - a.periodPoints || b.fame - a.fame);
          setClans(sortedClans);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center p-10 text-white/50">Caricamento Radar...</div>;
  }

  if (clans.length === 0) {
    return <div className="text-center p-10 text-white/50">Nessun dato guerra disponibile.</div>;
  }

  const maxPoints = Math.max(...clans.map(c => c.periodPoints));

  return (
    <div className="animate-fadeIn p-4">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-rajdhani font-bold text-white uppercase tracking-wider">Radar Nemici ⛵</h2>
          <p className="text-sm text-[#8888a8] mt-1">Traccia la posizione delle barche avversarie in tempo reale</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {clans.map((clan, index) => {
          const isUs = index === clans.findIndex(c => c.name === 'I Lupi Rossi'); // Adjust if clan name differs
          const percentage = maxPoints > 0 ? (clan.periodPoints / maxPoints) * 100 : 0;
          
          return (
            <div key={clan.tag} className={`bg-black/40 border ${isUs ? 'border-cr-gold/40' : 'border-white/5'} p-4 rounded-xl`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold font-rajdhani text-white/40">#{index + 1}</span>
                  <h3 className={`font-bold ${isUs ? 'text-cr-gold' : 'text-white'}`}>{clan.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-rajdhani text-white">{clan.periodPoints}</div>
                  <div className="text-xs text-[#8888a8]">punti oggi</div>
                </div>
              </div>
              
              <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full rounded-full ${isUs ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 'bg-gradient-to-r from-red-900 to-red-600'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
