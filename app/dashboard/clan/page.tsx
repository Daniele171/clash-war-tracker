'use client';

import { useEffect, useState } from 'react';

export default function ClanTab() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/members')
      .then(r => r.json())
      .then(d => {
        setMembers(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-20 text-[#8888a8]">Caricamento...</div>;

  const active = members.filter(m => m.active);
  const inactive = members.filter(m => !m.active);

  return (
    <>
      <div className="font-rajdhani text-[17px] font-bold text-cr-gold mb-3 flex items-center gap-2">👥 Membri Attivi ({active.length})</div>
      <div className="flex flex-col gap-1.5 mb-6">
        {active.length === 0 ? <p className="text-[#8888a8] text-[13px] text-center p-4">Nessun membro. Sincronizza per scaricarli.</p> : null}
        {active.map(m => (
          <div key={m.tag} className="flex items-center gap-2.5 p-2.5 bg-bg-card border border-border-gold rounded-lg hover:border-[rgba(240,192,48,0.5)] hover:bg-[rgba(255,255,255,0.07)] transition-all">
            <div className="flex-1">
              <div className="font-semibold text-[13px]">{m.name}</div>
              <div className="text-[11px] text-[#8888a8] mt-0.5">
                <span className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: m.role === 'leader' ? '#ef4444' : m.role === 'coLeader' ? '#f97316' : '#a78bfa' }}>
                  {m.role === 'leader' ? 'Capo' : m.role === 'coLeader' ? 'Co-capo' : m.role === 'elder' ? 'Anziano' : 'Recluta'}
                </span>
                &nbsp;&middot;&nbsp;<span className="font-mono">{m.tag}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {inactive.length > 0 && (
        <>
          <hr className="border-t border-border-gold my-4" />
          <div className="font-rajdhani text-[14px] font-bold text-[#8888a8] mb-3 flex items-center gap-2">🗄️ Usciti / Rimossi ({inactive.length})</div>
          <div className="flex flex-col gap-1.5">
            {inactive.map(m => (
              <div key={m.tag} className="flex items-center gap-2.5 p-2.5 bg-bg-card border border-border-gold rounded-lg opacity-50">
                <div className="flex-1">
                  <div className="font-semibold text-[13px]">{m.name}</div>
                  <div className="text-[11px] text-[#8888a8] mt-0.5 font-mono">{m.tag}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
