'use client';
import { useEffect, useMemo } from 'react';

export interface UserInfo { username: string; role: string; email: string; }

export default function WelcomeModal({ user, onDone }: { user: UserInfo; onDone: () => void }) {
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