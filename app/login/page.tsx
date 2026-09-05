'use client';

import { useState } from 'react';
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

  return (
    <div className="min-h-screen bg-[#080815] flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <div className="text-[48px] drop-shadow-[0_0_20px_rgba(240,192,48,0.6)] animate-[float_3s_ease-in-out_infinite] mb-3">♔</div>
          <h1 className="font-rajdhani text-[28px] font-bold text-cr-gold tracking-wide">
            Clan War Tracker
          </h1>
          <p className="text-[13px] text-[#8888a8] mt-1">Accesso Clan</p>
        </div>

        <div className="bg-bg-card border border-border-gold rounded-2xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-rajdhani font-bold text-[#8888a8] uppercase tracking-wider pl-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                placeholder="email@esempio.com"
                className="bg-[rgba(12,12,28,0.6)] border border-border-gold rounded-xl px-4 py-3.5 text-[15px] text-white placeholder-[#444466] focus:outline-none focus:border-cr-gold focus:bg-[rgba(20,20,40,0.8)] transition-all shadow-inner"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-rajdhani font-bold text-[#8888a8] uppercase tracking-wider pl-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="bg-[rgba(12,12,28,0.6)] border border-border-gold rounded-xl px-4 py-3.5 text-[15px] text-white placeholder-[#444466] focus:outline-none focus:border-cr-gold focus:bg-[rgba(20,20,40,0.8)] transition-all shadow-inner tracking-widest font-mono"
              />
            </div>
            {error && <div className="bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.4)] text-[#f87171] text-[13px] rounded-lg px-3.5 py-2.5">❌ {error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-cr-gold text-[#080815] font-rajdhani font-bold text-[16px] py-3 rounded-lg hover:bg-[#f5d060] active:scale-95 transition-all disabled:opacity-50 mt-2">
              {loading ? '◳ Accesso...' : 'Entra →'}
            </button>
          </form>
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
