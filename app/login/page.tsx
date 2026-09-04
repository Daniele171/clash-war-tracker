'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';

type Step = 'email' | 'password' | 'otp';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Step 1: Submit email
  // Supabase doesn't let us easily check if user is admin before login without RPC or public table.
  // BUT we can just try to sign in with OTP. If they are admin, maybe they still get OTP?
  // Actually, we can check if they have a password set, or just provide a toggle 'Sei un admin?'
  // For simplicity, let's just ask if they want to login with Password or OTP.
  // We'll keep the single flow: assume OTP for everyone. If they click 'Sono Admin', show password field.
  
  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // only existing users can login
        }
      });
      if (error) throw error;
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Errore. Assicurati che il tuo account sia stato creato.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError('Credenziali non valide');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      if (error) throw error;
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError('Codice non valido o scaduto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080815] flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <div className="text-[48px] drop-shadow-[0_0_20px_rgba(240,192,48,0.6)] animate-[float_3s_ease-in-out_infinite] mb-3">⚔️</div>
          <h1 className="font-rajdhani text-[28px] font-bold text-cr-gold tracking-wide">
            Clan War Tracker
          </h1>
          <p className="text-[13px] text-[#8888a8] mt-1">Accesso tramite Supabase</p>
        </div>

        <div className="bg-bg-card border border-border-gold rounded-2xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">

          {step === 'email' && !isAdmin && (
            <form onSubmit={handleOtpLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] text-[#8888a8] font-semibold uppercase tracking-wider mb-1.5">
                  Email Membro
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="tuo@email.com"
                  className="w-full bg-[#0c0c1c] border border-border-gold rounded-lg px-3.5 py-2.5 text-[14px] text-white placeholder-[#555575] focus:outline-none focus:border-cr-gold focus:ring-1 focus:ring-cr-gold transition-colors"
                />
              </div>
              {error && <div className="bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.4)] text-[#f87171] text-[13px] rounded-lg px-3.5 py-2.5">❌ {error}</div>}
              <button type="submit" disabled={loading} className="w-full bg-cr-gold text-[#080815] font-rajdhani font-bold text-[16px] py-3 rounded-lg hover:bg-[#f5d060] active:scale-95 transition-all disabled:opacity-50">
                {loading ? '⏳ Invio OTP...' : 'Ricevi Codice OTP →'}
              </button>
              <button type="button" onClick={() => { setIsAdmin(true); setError(''); }} className="text-[12px] text-[#8888a8] hover:text-white transition-colors text-center">
                👑 Sono un Admin
              </button>
            </form>
          )}

          {step === 'email' && isAdmin && (
            <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] text-[#8888a8] font-semibold uppercase tracking-wider mb-1.5">
                  Email Admin
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="admin@email.com"
                  className="w-full bg-[#0c0c1c] border border-border-gold rounded-lg px-3.5 py-2.5 text-[14px] text-white placeholder-[#555575] focus:outline-none focus:border-cr-gold focus:ring-1 focus:ring-cr-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#8888a8] font-semibold uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#0c0c1c] border border-border-gold rounded-lg px-3.5 py-2.5 text-[14px] text-white placeholder-[#555575] focus:outline-none focus:border-cr-gold focus:ring-1 focus:ring-cr-gold transition-colors"
                />
              </div>
              {error && <div className="bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.4)] text-[#f87171] text-[13px] rounded-lg px-3.5 py-2.5">❌ {error}</div>}
              <button type="submit" disabled={loading} className="w-full bg-cr-gold text-[#080815] font-rajdhani font-bold text-[16px] py-3 rounded-lg hover:bg-[#f5d060] active:scale-95 transition-all disabled:opacity-50">
                {loading ? '⏳ Accesso...' : 'Accedi'}
              </button>
              <button type="button" onClick={() => { setIsAdmin(false); setError(''); }} className="text-[12px] text-[#8888a8] hover:text-white transition-colors text-center">
                👤 Sono un Membro
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div className="text-center">
                <div className="text-[13px] text-[#8888a8]">Codice inviato a</div>
                <div className="font-semibold text-[#f0f0ff] mt-0.5">{email}</div>
              </div>
              <div>
                <label className="block text-[11px] text-[#8888a8] font-semibold uppercase tracking-wider mb-1.5">
                  Codice OTP (6 cifre)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  placeholder="000000"
                  className="w-full bg-[#0c0c1c] border border-border-gold rounded-lg px-3.5 py-2.5 text-[20px] text-white text-center tracking-[6px] placeholder-[#555575] focus:outline-none focus:border-cr-gold focus:ring-1 focus:ring-cr-gold transition-colors font-mono"
                />
              </div>
              {error && <div className="bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.4)] text-[#f87171] text-[13px] rounded-lg px-3.5 py-2.5">❌ {error}</div>}
              <button type="submit" disabled={loading || otp.length !== 6} className="w-full bg-cr-gold text-[#080815] font-rajdhani font-bold text-[16px] py-3 rounded-lg hover:bg-[#f5d060] active:scale-95 transition-all disabled:opacity-50">
                {loading ? '⏳ Verifica...' : 'Accedi'}
              </button>
              <button type="button" onClick={() => { setStep('email'); setError(''); setOtp(''); }} className="text-[#8888a8] hover:text-white transition-colors text-[12px] text-center mt-2">
                ← Cambia email
              </button>
            </form>
          )}
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
