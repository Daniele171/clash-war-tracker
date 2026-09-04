'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function HistoryTab() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(d => {
        setHistory(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-20 text-[#8888a8]">Caricamento...</div>;

  if (history.error) return <div>Errore Database: {history.error}</div>;
  if (history.length === 0) return (
    <div className="text-center py-12 px-6 text-[#8888a8]">
      <div className="text-[48px] mb-4 opacity-50 block">📊</div>
      <div className="font-rajdhani text-[20px] font-bold text-[#f0f0ff] mb-2">Nessuno storico trovato</div>
    </div>
  );

  return (
    <>
      <div className="font-rajdhani text-[17px] font-bold text-cr-gold mb-3 flex items-center gap-2">📊 Statistiche Furbi</div>
      <div className="card mb-5">
        <p className="text-[#8888a8] text-[13px] text-center italic py-4">Il modulo di analisi "Furbi" verrà popolato a fine settimana dopo le prime sincronizzazioni automatiche del cron job.</p>
      </div>

      <div className="font-rajdhani text-[17px] font-bold text-cr-gold mb-3 flex items-center gap-2">📅 Registro War Passate</div>
      <div className="flex flex-col gap-2.5">
        {history.map((war) => (
          <div key={war.seasonId + war.sectionIndex} className="bg-bg-card border border-border-gold rounded-xl overflow-hidden hover:border-[rgba(240,192,48,0.5)] transition-colors">
            <div className="flex items-center justify-between p-3.5">
              <div>
                <div className="font-rajdhani text-[18px] font-bold">Stagione {war.seasonId} - Settimana {war.sectionIndex + 1}</div>
                <div className="text-[12px] text-[#8888a8] mt-0.5">📅 {format(new Date(war.createdDate.replace('T', ' ').replace('.000Z', '')), 'dd MMM yyyy', { locale: it })}</div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-rajdhani text-[16px] font-bold text-cr-gold">🏅 {war.clan.fame.toLocaleString()}</span>
                <span className="badge bg-[rgba(90,90,120,0.15)] border-[rgba(90,90,120,0.3)] text-[#8888a8]">🏁 Chiusa</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
