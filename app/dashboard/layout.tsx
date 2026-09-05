'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface UserInfo {
  username: string;
  role: 'admin' | 'viewer';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.username) {
        setUserInfo({ username: d.username, role: d.role || 'viewer' });
      }
    }).catch(() => {});
  }, []);

  const isAdmin = userInfo?.role === 'admin';

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync/me');
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        alert('Errore sync: ' + (data.error || 'Riprova'));
      }
    } catch {
      alert('Errore di rete');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { path: '/dashboard', label: 'Guerra', icon: '⚔️' },
    { path: '/dashboard/history', label: 'Storico', icon: '📅' },
    { path: '/dashboard/clan', label: 'Clan', icon: '👥' },
    // Config tab only visible to admins
    ...(isAdmin ? [{ path: '/dashboard/settings', label: 'Config', icon: '⚙️' }] : []),
  ];

  return (
    <div className="pb-20">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-[62px] bg-[#080815]/90 backdrop-blur-md border-b border-border-gold z-50 shadow-[0_2px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-[860px] h-full mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl drop-shadow-[0_0_10px_rgba(240,192,48,0.6)] animate-[float_3s_ease-in-out_infinite]">⚔️</div>
            <div>
              <div className="font-rajdhani text-[20px] font-bold text-cr-gold drop-shadow-glow-gold tracking-wide">Clan War Tracker</div>
              {userInfo && (
                <div className="text-[10px] text-[#8888a8] flex items-center gap-1">
                  <span className="animate-[fadeIn_0.5s_ease]">
                    {isAdmin ? '👑' : '👤'} {userInfo.username}
                    {isAdmin && <span className="ml-1 text-cr-gold/60">· Admin</span>}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-bg-card border border-border-gold rounded-lg text-white w-10 h-10 flex items-center justify-center hover:border-cr-gold hover:bg-[rgba(240,192,48,0.22)] hover:scale-105 transition-all disabled:opacity-50"
                title="Sincronizza da API CR"
              >
                <span className={isSyncing ? 'animate-spin inline-block' : 'inline-block'}>🔄</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-bg-card border border-border-gold rounded-lg text-[#8888a8] w-10 h-10 flex items-center justify-center hover:border-red-500 hover:text-red-400 hover:bg-[rgba(220,38,38,0.1)] transition-all"
              title="Esci"
            >
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-[56px] bg-[#0a0a16]/97 backdrop-blur-md border-t border-border-gold z-40 flex justify-center shadow-[0_-2px_20px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex-1 max-w-[210px] flex flex-col items-center justify-center gap-0.5 relative transition-all duration-200 ${isActive ? 'text-cr-gold' : 'text-[#8888a8] hover:text-white'}`}
            >
              {isActive && (
                <div className="absolute top-0 left-[20%] right-[20%] h-[2px] bg-cr-gold rounded-b-sm shadow-[0_0_8px_rgba(240,192,48,0.8)]" />
              )}
              <span className={`text-[17px] transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
              <span className="text-[10px] font-semibold tracking-wide uppercase">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <main className="pt-[78px] px-4 max-w-[860px] mx-auto animate-[fadeUp_0.22s_ease]">
        {/* Pass userInfo via a global context trick using a hidden element */}
        <div id="current-user-data" data-username={userInfo?.username || ''} data-role={userInfo?.role || ''} className="hidden" />
        {children}
      </main>
    </div>
  );
}
