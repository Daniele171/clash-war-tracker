'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Errore durante la sincronizzazione (Configura prima le chiavi in Config)');
      }
    } catch (e) {
      alert('Errore di rete');
    } finally {
      setIsSyncing(false);
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Guerra', icon: '⚔️' },
    { path: '/dashboard/history', label: 'Storico', icon: '📅' },
    { path: '/dashboard/clan', label: 'Clan', icon: '👥' },
    { path: '/dashboard/settings', label: 'Config', icon: '⚙️' },
  ];

  return (
    <div className="pb-12">
      <header className="fixed top-0 left-0 right-0 h-[62px] bg-[#080815]/90 backdrop-blur-md border-b border-border-gold z-50 shadow-[0_2px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-[860px] h-full mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl drop-shadow-[0_0_10px_rgba(240,192,48,0.6)] animate-[float_3s_ease-in-out_infinite]">⚔️</div>
            <div>
              <div className="font-rajdhani text-[20px] font-bold text-cr-gold drop-shadow-glow-gold tracking-wide">Clan War Tracker</div>
              <div className="text-[11px] text-[#8888a8] mt-[1px]">Auto-sync Backend Edition</div>
            </div>
          </div>
          <div>
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="bg-bg-card border border-border-gold rounded-lg text-white w-10 h-10 flex items-center justify-center hover:border-cr-gold hover:bg-[rgba(240,192,48,0.22)] hover:scale-105 transition-all disabled:opacity-50"
              title="Sincronizza da API CR"
            >
              <span className={isSyncing ? "animate-spin" : ""}>🔄</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed top-[62px] left-0 right-0 h-[54px] bg-[#0a0a16]/95 backdrop-blur-md border-b border-border-gold z-40 flex justify-center">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex-1 max-w-[210px] flex flex-col items-center justify-center gap-0.5 relative transition-all duration-200 ${isActive ? 'text-cr-gold' : 'text-[#8888a8] hover:text-white'}`}
            >
              <span className="text-[17px]">{item.icon}</span>
              <span className="text-[10px] font-semibold tracking-wide uppercase">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-[20%] right-[20%] h-[2px] bg-cr-gold rounded-t-sm" />
              )}
            </Link>
          );
        })}
      </nav>

      <main className="pt-[132px] px-4 max-w-[860px] mx-auto animate-[fadeUp_0.22s_ease]">
        {children}
      </main>
    </div>
  );
}
