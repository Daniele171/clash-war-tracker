'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface UserInfo {
  username: string;
  email: string;
  role: 'admin' | 'viewer';
}

const APP_VERSION = 'v2.0';

const PATCH_NOTES = [
  { icon: '📊', text: 'Tabella Clan ordinabile per Nome, Ruolo e Anzianità' },
  { icon: '📅', text: 'Data di ingresso membri tracciata automaticamente' },
  { icon: '🔄', text: 'Sincronizzazione automatica all\'apertura della dashboard' },
  { icon: '🔐', text: 'Login ora avviene solo tramite Email' },
  { icon: '🐛', text: 'Risolto il crash della pagina Storico' },
  { icon: '✨', text: 'Nuove animazioni e miglioramenti visivi' },
];

// --- Welcome Modal ---
function WelcomeModal({ user, onDone }: { user: UserInfo; onDone: () => void }) {
  const isAdmin = user.role === 'admin';
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  const particles = useMemo(() => {
    return [...Array(12)].map(() => ({
      width: `${Math.random() * 6 + 2}px`,
      height: `${Math.random() * 6 + 2}px`,
      background: `rgba(240,192,48,${Math.random() * 0.5 + 0.2})`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animation: `float-particle ${Math.random() * 3 + 2}s ease-in-out infinite`,
      animationDelay: `${Math.random() * 2}s`,
    }));
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(8,8,21,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onDone}
    >
      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={p}
          />
        ))}
      </div>

      {/* Card */}
      <div className="relative text-center px-8 py-10 rounded-2xl border border-[rgba(240,192,48,0.3)] bg-[rgba(12,12,28,0.97)] shadow-[0_0_60px_rgba(240,192,48,0.15)] animate-[welcomeIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both] max-w-[340px] w-full mx-4">
        {/* Glow top line */}
        <div className="absolute top-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-[rgba(240,192,48,0.7)] to-transparent" />

        <div className="text-[52px] mb-3 animate-[float_3s_ease-in-out_infinite]">
          {isAdmin ? '👑' : '⚔️'}
        </div>

        <div className="text-[13px] text-[#8888a8] uppercase tracking-[0.2em] mb-1.5 font-semibold">
          Benvenuto
        </div>
        <div className="font-rajdhani text-[34px] font-bold text-cr-gold drop-shadow-[0_0_20px_rgba(240,192,48,0.5)] leading-tight">
          {user.username}
        </div>
        {isAdmin && (
          <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(240,192,48,0.1)] border border-[rgba(240,192,48,0.3)] text-cr-gold text-[11px] font-bold uppercase tracking-wider">
            👑 Amministratore
          </div>
        )}
        <div className="mt-2 text-[11px] text-[#444466] font-mono truncate max-w-[240px] mx-auto">
          {user.email}
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-[2px] rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cr-gold to-cr-yellow rounded-full"
            style={{ animation: 'progress-fill 2.8s linear forwards' }}
          />
        </div>
        <div className="mt-2 text-[10px] text-[#444466]">Tap per chiudere</div>
      </div>
    </div>
  );
}

// --- Patch Notes Modal ---
function PatchNotesModal({ onDone }: { onDone: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[190] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(8,8,21,0.7)', backdropFilter: 'blur(8px)' }}
    >
      <div className="relative w-full max-w-[400px] rounded-2xl border border-[rgba(124,58,237,0.4)] bg-[rgba(12,12,28,0.98)] shadow-[0_0_60px_rgba(124,58,237,0.2)] animate-[slideUp_0.4s_cubic-bezier(0.34,1.3,0.64,1)_both]">
        <div className="absolute top-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-[rgba(124,58,237,0.7)] to-transparent" />

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-[28px]">🚀</div>
            <div>
              <div className="font-rajdhani text-[20px] font-bold text-white">Novità {APP_VERSION}</div>
              <div className="text-[11px] text-[#8888a8]">Aggiornamento · 6 Settembre 2026</div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 mb-6">
            {PATCH_NOTES.map((note, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 text-[13px] text-[#c8c8e0]"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <span className="text-[16px] shrink-0 mt-[-1px]">{note.icon}</span>
                <span>{note.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onDone}
            className="w-full btn btn-primary py-3 text-[14px] justify-center"
          >
            ✅ Ho capito, andiamo!
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Toast Notification ---
function Toast({ message, type, onDone }: { message: string; type: 'success' | 'info' | 'error'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  const colors = {
    success: 'border-[rgba(22,163,74,0.5)] bg-[rgba(22,163,74,0.12)] text-[#4ade80]',
    info: 'border-[rgba(37,99,235,0.5)] bg-[rgba(37,99,235,0.12)] text-[#60a5fa]',
    error: 'border-[rgba(220,38,38,0.5)] bg-[rgba(220,38,38,0.12)] text-[#f87171]',
  };

  return (
    <div
      className={`fixed bottom-[72px] left-1/2 -translate-x-1/2 z-[180] px-4 py-2.5 rounded-xl border text-[13px] font-semibold shadow-lg animate-[slideUp_0.3s_ease] whitespace-nowrap ${colors[type]}`}
    >
      {message}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showPatchNotes, setShowPatchNotes] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
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
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.username) {
        const info: UserInfo = { username: d.username, email: d.email || '', role: d.role || 'viewer' };
        setUserInfo(info);

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

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync/me');
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
    { path: '/dashboard/history', label: 'Storico', icon: '📅' },
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
        <div id="current-user-data" data-username={userInfo?.username || ''} data-role={userInfo?.role || ''} className="hidden" />
        {children}
      </main>
    </div>
  );
}
