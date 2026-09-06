'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

type SortField = 'name' | 'role' | 'joinedDate';
type SortDirection = 'asc' | 'desc';

const roleOrder: Record<string, number> = {
  leader: 4,
  coLeader: 3,
  elder: 2,
  member: 1
};

const roleNames: Record<string, string> = {
  leader: 'Capo',
  coLeader: 'Co-capo',
  elder: 'Anziano',
  member: 'Recluta'
};

const roleColors: Record<string, string> = {
  leader: '#ef4444',
  coLeader: '#f97316',
  elder: '#a78bfa',
  member: '#8888a8'
};

export default function ClanTab() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [sortField, setSortField] = useState<SortField>('role');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    fetch('/api/members')
      .then(r => r.json())
      .then(d => {
        setMembers(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // default to desc for new fields
    }
  };

  if ((members as any).error) return <div>Errore Database: {(members as any).error}</div>;
  if (loading) return <div className="text-center py-20 text-[#8888a8]">Caricamento...</div>;

  let active = (members || []).filter(m => m.active);
  const inactive = (members || []).filter(m => !m.active);

  // Sorting logic
  active.sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else if (sortField === 'role') {
      cmp = (roleOrder[a.role] || 0) - (roleOrder[b.role] || 0);
    } else if (sortField === 'joinedDate') {
      const dateA = a.joinedDate ? new Date(a.joinedDate).getTime() : 0;
      const dateB = b.joinedDate ? new Date(b.joinedDate).getTime() : 0;
      cmp = dateA - dateB;
    }
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  const renderSortArrow = (field: SortField) => {
    if (sortField !== field) return <span className="opacity-30">↕</span>;
    return sortDirection === 'asc' ? <span className="text-cr-gold">▲</span> : <span className="text-cr-gold">▼</span>;
  };

  return (
    <>
      <div className="font-rajdhani text-[17px] font-bold text-cr-gold mb-3 flex items-center gap-2">
        👥 Membri Attivi ({active.length})
      </div>
      
      <div className="bg-bg-card border border-border-gold rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[420px]">
            <thead>
              <tr>
                <th className="bg-[rgba(240,192,48,0.07)] border-b border-[rgba(255,255,255,0.04)] px-3 py-2 text-left cursor-pointer hover:bg-[rgba(240,192,48,0.15)] transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2 text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider">
                    Giocatore {renderSortArrow('name')}
                  </div>
                </th>
                <th className="bg-[rgba(240,192,48,0.07)] border-b border-[rgba(255,255,255,0.04)] px-3 py-2 text-left cursor-pointer hover:bg-[rgba(240,192,48,0.15)] transition-colors" onClick={() => handleSort('role')}>
                  <div className="flex items-center gap-2 text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider">
                    Ruolo {renderSortArrow('role')}
                  </div>
                </th>
                <th className="bg-[rgba(240,192,48,0.07)] border-b border-[rgba(255,255,255,0.04)] px-3 py-2 text-left cursor-pointer hover:bg-[rgba(240,192,48,0.15)] transition-colors" onClick={() => handleSort('joinedDate')}>
                  <div className="flex items-center gap-2 text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider">
                    Anzianità {renderSortArrow('joinedDate')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {active.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-[#8888a8] text-[13px] text-center p-4">
                    Nessun membro. Sincronizza per scaricarli.
                  </td>
                </tr>
              ) : null}
              {active.map((m, i) => (
                <tr key={m.tag} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-[13px]">{m.name}</div>
                    <div className="text-[10px] text-[#444466] font-mono">{m.tag}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span 
                      className="font-semibold uppercase tracking-wider text-[10px]" 
                      style={{ color: roleColors[m.role] || roleColors.member }}
                    >
                      {roleNames[m.role] || 'Recluta'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-[#8888a8]">
                    {m.joinedDate ? format(new Date(m.joinedDate), 'dd MMM yyyy', { locale: it }) : 'Sconosciuta'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {inactive.length > 0 && (
        <>
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
