'use client';

import Toast from '@/components/Toast';
import WelcomeModal from '@/components/WelcomeModal';
import PatchNotesModal, { APP_VERSION } from '@/components/PatchNotesModal';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MASTER_ADMIN_EMAIL } from '@/lib/constants';

interface UserInfo {
  username: string;
  email: string;
  role: 'admin' | 'viewer';
  isMaster?: boolean;
}






// --- Welcome Modal ---


// --- Patch Notes Modal ---


// --- Toast Notification ---


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showPatchNotes, setShowPatchNotes] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [perms, setPerms] = useState<any>(null);
  const autoSyncDone = useRef(false);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  // Auto-sync silenzioso — per tutti gli utenti
  const doAutoSync = useCallback(async () => {
    if (autoSyncDone.current) return;
    autoSyncDone.current = true;
    try {
      const res = await fetch('/api/sync/all', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        if (data.updated) {
          showToast('🔄 Dati aggiornati!', 'info');
        }
      }
    } catch {
      // Silent fail — non disturbare l'utente
    }
  }, [showToast]);

  const checkPatchNotes = useCallback(() => {
    const seenVersion = localStorage.getItem('patch_notes_seen');
    if (seenVersion !== APP_VERSION) {
      setShowPatchNotes(true);
    }
  }, []);

  const handleWelcomeDone = useCallback(() => {
    setShowWelcome(false);
    checkPatchNotes();
  }, [checkPatchNotes]);

  const handlePatchNotesDone = useCallback(() => {
    localStorage.setItem('patch_notes_seen', APP_VERSION);
    setShowPatchNotes(false);
  }, []);

  useEffect(() => {
    // Auto-logout (3 hours) e Activity Tracking
    const THRESHOLD = 3 * 60 * 60 * 1000; // 3 ore
    
    const checkActivity = () => {
      const lastActiveStr = localStorage.getItem('cwt:last_active_local');
      const now = Date.now();
      if (lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        if (now - lastActive > THRESHOLD) {
          localStorage.removeItem('cwt:last_active_local');
          // Perform signout
          import('@/utils/supabase/client').then(({ createClient }) => {
            const supabase = createClient();
            supabase.auth.signOut().then(() => {
              router.push('/login?timeout=1');
            });
          });
          return true;
        }
      }
      localStorage.setItem('cwt:last_active_local', now.toString());
      return false;
    };

    if (checkActivity()) return;
    
    fetch('/api/activity', { method: 'POST' }).catch(() => {});
    
    const interval = setInterval(() => {
      if (!checkActivity()) {
        fetch('/api/activity', { method: 'POST' }).catch(() => {});
      } else {
        clearInterval(interval);
      }
    }, 1000 * 60 * 15);

    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.username) {
        const info: UserInfo = { username: d.username, email: d.email || '', role: d.role || 'viewer' };
        setUserInfo(info);

        if (d.role === 'admin') {
          fetch('/api/permissions').then(r => r.json()).then(pd => setPerms(pd.permissions));
        }

        // Welcome screen: once per session
        const sessionKey = `welcome_shown_${d.username}`;
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, '1');
          setShowWelcome(true);
        } else {
          // No welcome → check patch notes immediately
          checkPatchNotes();
        }

        // Auto-sync for ALL users
        doAutoSync();
      }
    }).catch(() => {});
  }, [doAutoSync, checkPatchNotes]);

  const isAdmin = userInfo?.role === 'admin';
  const isMaster = Boolean(userInfo?.isMaster || userInfo?.email === MASTER_ADMIN_EMAIL);
  const canForceSync = isMaster || (isAdmin && perms?.adminCanForceSync !== false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync/all');
      if (res.ok) {
        showToast('✅ Sincronizzazione completata!', 'success');
        setTimeout(() => window.location.reload(), 800);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast('❌ Errore: ' + (data.error || 'Riprova'), 'error');
      }
    } catch {
      showToast('❌ Errore di rete', 'error');
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
    { path: '/dashboard/radar', label: 'Radar', icon: '⛵' },
    { path: '/dashboard/history', label: 'Storico', icon: '📅' },
    { path: '/dashboard/leaderboard', label: 'Mazzi & Top', icon: '🏆' },
    { path: '/dashboard/clan', label: 'Clan', icon: '👥' },
    ...(isAdmin ? [{ path: '/dashboard/settings', label: 'Config', icon: '⚙️' }] : []),
  ];

  return (
    <div className="pb-20">
      {/* Modals */}
      {showWelcome && userInfo && (
        <WelcomeModal user={userInfo} onDone={handleWelcomeDone} />
      )}
      {!showWelcome && showPatchNotes && (
        <PatchNotesModal onDone={handlePatchNotesDone} />
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
      )}

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
                    {!isAdmin && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.4)] text-[#a78bfa] text-[9px] uppercase tracking-wider" title="Puoi visualizzare i dati in tempo reale ma non puoi gestire le giustificazioni o forzare l'aggiornamento">Viewer Mode</span>}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canForceSync && (
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
        <div id="current-user-data" data-username={userInfo?.username || ''} data-role={userInfo?.role || ''} className="hidden" />
        {children}
      </main>
    </div>
  );
}
