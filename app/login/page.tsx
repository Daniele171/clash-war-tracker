'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';

function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Email o password non validi');
    } finally {
      setLoading(false);
    }
  };

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#080815] via-[#101025] to-[#1a103c] bg-pan relative overflow-hidden animate-fade-in">
      {/* Toast Notification */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${showToast ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-95 pointer-events-none'}`}>
        <div className="bg-[#151525]/90 backdrop-blur-xl border border-cr-gold/50 shadow-[0_0_20px_rgba(240,192,48,0.2)] rounded-2xl px-6 py-4 flex items-center gap-3">
          <div className="text-[20px]">👋</div>
          <div className="text-[13px] text-white">
            <span className="font-bold text-cr-gold">Contatta l'amministratore (Daniele)</span><br/>
            su Telegram per farti resettare la password.
          </div>
        </div>
      </div>

      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cr-purple/20 rounded-full blur-[100px] pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cr-gold/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[380px] z-10">
        <div className="text-center mb-8 animate-slide-up">
          <div className="text-[48px] drop-shadow-[0_0_20px_rgba(240,192,48,0.6)] animate-[float_3s_ease-in-out_infinite] mb-3">♔</div>
          <h1 className="font-rajdhani text-[32px] font-bold text-cr-gold tracking-wide text-glow-gold">
            Clan War Tracker
          </h1>
          <p className="text-[14px] text-[#a0a0c0] mt-1 tracking-widest uppercase">Accesso Clan</p>
        </div>

        <div className="glass-panel rounded-3xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5)] animate-slide-up-delayed border-border-gold/30">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-rajdhani font-bold text-[#a0a0c0] uppercase tracking-wider pl-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                placeholder="email@esempio.com"
                className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl shadow-inner py-3.5 px-4 text-[15px] text-white placeholder-[#555575] focus:outline-none focus:ring-2 focus:ring-cr-gold/50 focus:border-cr-gold/50 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-rajdhani font-bold text-[#a0a0c0] uppercase tracking-wider pl-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl shadow-inner py-3.5 px-4 text-[15px] text-white placeholder-[#555575] focus:outline-none focus:ring-2 focus:ring-cr-gold/50 focus:border-cr-gold/50 transition-all tracking-widest font-mono"
              />
            </div>
            {error && <div className="bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.4)] text-[#f87171] text-[13px] rounded-lg px-3.5 py-2.5 mt-1 animate-fade-in">❌ {error}</div>}
            
            <button type="submit" disabled={loading} className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-[0_0_15px_rgba(250,204,21,0.2)] text-sm font-bold text-[#080815] bg-gradient-to-r from-[#facc15] to-[#eab308] hover:from-[#eab308] hover:to-[#ca8a04] focus:outline-none transition-all disabled:opacity-50 mt-6 active:scale-95 animate-pulse-glow hover:shadow-[0_0_25px_rgba(250,204,21,0.4)] font-rajdhani tracking-wider text-[16px]">
              {loading ? '◳ Accesso...' : 'Entra →'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-[12px] text-[#8888a8] leading-relaxed">
            Hai dimenticato la password o sei stato disconnesso per inattività?<br/>
            <span className="text-[#facc15] cursor-pointer hover:underline transition-all hover:text-white" onClick={triggerToast}>Contatta l'amministratore</span> per il ripristino.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080815] flex items-center justify-center text-[#8888a8]">Caricamento...</div>}>
      <LoginForm />
    </Suspense>
  );
}
