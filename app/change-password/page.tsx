'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError('Le password non coincidono');
      return;
    }
    if (newPassword.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Errore durante il cambio password');
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Errore di rete, riprova');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080815] flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <div className="text-[40px] mb-3">🔐</div>
          <h1 className="font-rajdhani text-[24px] font-bold text-cr-gold tracking-wide">
            Imposta la tua Password
          </h1>
          <p className="text-[13px] text-[#8888a8] mt-1">
            È il tuo primo accesso — scegli una password sicura
          </p>
        </div>

        <div className="bg-bg-card border border-border-gold rounded-2xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] text-[#8888a8] font-semibold uppercase tracking-wider mb-1.5">
                Nuova Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimo 6 caratteri"
                className="w-full bg-[#0c0c1c] border border-border-gold rounded-lg px-3.5 py-2.5 text-[14px] text-white placeholder-[#555575] focus:outline-none focus:border-cr-gold focus:ring-1 focus:ring-cr-gold transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#8888a8] font-semibold uppercase tracking-wider mb-1.5">
                Conferma Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Ripeti la password"
                className="w-full bg-[#0c0c1c] border border-border-gold rounded-lg px-3.5 py-2.5 text-[14px] text-white placeholder-[#555575] focus:outline-none focus:border-cr-gold focus:ring-1 focus:ring-cr-gold transition-colors"
              />
            </div>

            {error && (
              <div className="bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.4)] text-[#f87171] text-[13px] rounded-lg px-3.5 py-2.5">
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cr-gold text-[#080815] font-rajdhani font-bold text-[16px] py-3 rounded-lg hover:bg-[#f5d060] active:scale-95 transition-all disabled:opacity-50 mt-1"
            >
              {loading ? '⏳ Salvataggio...' : 'Salva e Accedi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
