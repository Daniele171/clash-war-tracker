'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

type Step = 'email' | 'password' | 'otp';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: submit email → determine admin (password) or member (OTP)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Errore');
        return;
      }
      if (data.needsPassword) {
        setStep('password'); // admin
      } else {
        setStep('otp'); // member — OTP sent
      }
    } catch {
      setError('Errore di rete, riprova');
    } finally {
      setLoading(false);
    }
  };

  // Step 2a: admin submits password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Credenziali errate');
        return;
      }
      if (data.mustChangePassword) {
        router.push('/change-password');
      } else {
        router.push(searchParams.get('from') || '/dashboard');
      }
    } catch {
      setError('Errore di rete, riprova');
    } finally {
      setLoading(false);
    }
  };

  // Step 2b: member submits OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Codice non valido');
        return;
      }
      router.push(searchParams.get('from') || '/dashboard');
    } catch {
      setError('Errore di rete, riprova');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);
    await fetch('/api/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setOtp('');
  };

  return (
    <div className="min-h-screen bg-[#080815] flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-[48px] drop-shadow-[0_0_20px_rgba(240,192,48,0.6)] animate-[float_3s_ease-in-out_infinite] mb-3">⚔️</div>
          <h1 className="font-rajdhani text-[28px] font-bold text-cr-gold tracking-wide">
            Clan War Tracker
          </h1>
          <p className="text-[13px] text-[#8888a8] mt-1">Accedi per continuare</p>
        </div>

        {/* Card */}
        <div className="bg-bg-card border border-border-gold rounded-2xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">

          {/* STEP 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] text-[#8888a8] font-semibold uppercase tracking-wider mb-1.5">
                  Email
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
                {loading ? '⏳ Verifica...' : 'Continua →'}
              </button>
            </form>
          )}

          {/* STEP 2a: Password (admin) */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div className="text-[12px] text-[#8888a8] text-center mb-1">
                👑 Admin · <span className="text-[#f0f0ff]">{email}</span>
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
                  autoFocus
                  placeholder="••••••••"
                  className="w-full bg-[#0c0c1c] border border-border-gold rounded-lg px-3.5 py-2.5 text-[14px] text-white placeholder-[#555575] focus:outline-none focus:border-cr-gold focus:ring-1 focus:ring-cr-gold transition-colors"
                />
              </div>
              {error && <div className="bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.4)] text-[#f87171] text-[13px] rounded-lg px-3.5 py-2.5">❌ {error}</div>}
              <button type="submit" disabled={loading} className="w-full bg-cr-gold text-[#080815] font-rajdhani font-bold text-[16px] py-3 rounded-lg hover:bg-[#f5d060] active:scale-95 transition-all disabled:opacity-50">
                {loading ? '⏳ Accesso...' : 'Accedi'}
              </button>
              <button type="button" onClick={() => { setStep('email'); setError(''); }} className="text-[12px] text-[#8888a8] hover:text-white transition-colors text-center">
                ← Cambia email
              </button>
            </form>
          )}

          {/* STEP 2b: OTP (member) */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
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
              <div className="flex items-center justify-between text-[12px]">
                <button type="button" onClick={() => { setStep('email'); setError(''); setOtp(''); }} className="text-[#8888a8] hover:text-white transition-colors">
                  ← Cambia email
                </button>
                <button type="button" onClick={handleResendOTP} disabled={loading} className="text-cr-gold hover:text-[#f5d060] transition-colors">
                  Reinvia codice
                </button>
              </div>
            </form>
          )}
        </div>
        <p className="text-center text-[11px] text-[#555575] mt-6">Non hai un account? Contatta il tuo admin del clan.</p>
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
