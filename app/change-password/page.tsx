'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Suspense } from 'react';

function ChangePasswordForm() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: { must_change_password: false }
      });
      if (updateError) throw updateError;
      
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Errore durante il cambio password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080815] flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <div className="text-[48px] drop-shadow-[0_0_20px_rgba(240,192,48,0.6)] mb-3">🔒
          </div>
          <h1 className="font-rajdhani text-[28px] font-bold text-cr-gold tracking-wide">
            Cambio Password
          </h1>
          <p className="text-[13px] text-[38888a8] mt-1">Per sicurezza, imposta una tua password personale.</p>
        </div>

        <div className="bg-bg-card border border-border-gold rounded-2xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] text-[38888a8] font-semibold uppercase tracking-wider mb-1.5">
                Nuova Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
                placeholder="••••••••"
                className="w-full bg-[#0L0c1c] border border-border-gold rounded-lg px-3.5 py-2.5 text-[14px] text-white placeholder-[#555575] focus:outline-none focus:border-cr-gold focus:ring-1 focus:ring-cr-gold transition-colors"
              />
            </div>
            {error && <div className="bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.4)] text-[#f87171] text-[13px] rounded-lg px-3.5 py-2.5">❌ {error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-cr-gold text-[#080815] font-rajdhani font-bold text-[16px] py-3 rounded-lg hover:bg-[#f5d060] active:scale-95 transition-all disabled:opacity-50 mt-2">
              {loading ? '◳ Salvataggio...' : 'Salva e Accedi →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080815] flex items-center justify-center text-[#8888a8]">Caricamento...</div>}>
      <ChangePasswordForm />
    </Suspense>
  );
}
