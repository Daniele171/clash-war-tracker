'use client';

import { useEffect, useState } from 'react';

interface AppUser {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'viewer';
  createdAt: string;
}

export default function SettingsTab() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'viewer' | 'admin'>('viewer');
  const [createMsg, setCreateMsg] = useState('');
  const [creating, setCreating] = useState(false);

  const loadUsers = () => {
    setLoadingUsers(true);
    fetch('/api/users').then(r => r.json()).then(d => {
      setUsers(Array.isArray(d) ? d : []);
      setLoadingUsers(false);
    });
  };

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.role === 'admin') {
        setIsAdmin(true);
        loadUsers();
      } else {
        setLoadingUsers(false);
      }
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMsg('');
    setCreating(true);
    const trimmedUsername = newUsername.trim();
    const trimmedEmail = newEmail.trim();
    if (!trimmedUsername || !newPassword || !trimmedEmail) {
      setCreateMsg('Errore: Email, Username e Password sono obbligatori');
      setCreating(false);
      return;
    }
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, username: trimmedUsername, password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreateMsg('OK: Utente "' + trimmedUsername + '" creato! Al primo accesso dovra cambiare la password.');
        setNewEmail('');
        setNewUsername('');
        setNewPassword('');
        loadUsers();
      } else {
        setCreateMsg('Errore: ' + (data.error || 'Errore sconosciuto'));
      }
    } catch {
      setCreateMsg('Errore: Errore di rete');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm('Eliminare l utente "' + username + '"?')) return;
    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) loadUsers();
    else alert('Errore eliminazione');
  };

  const handleChangeRole = async (id: string, username: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'viewer' : 'admin';
    const action = newRole === 'admin' ? 'Promuovere ad Admin' : 'Declassare a Membro';
    if (!confirm(`${action} l'utente "${username}"?`)) return;
    
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role: newRole }),
    });
    
    if (res.ok) {
      loadUsers();
    } else {
      const data = await res.json().catch(()=>({}));
      alert('Errore: ' + (data.error || 'Impossibile cambiare ruolo'));
    }
  };

  return (
    <>
      {isAdmin && (
        <>
          <div className="font-rajdhani text-[17px] font-bold text-cr-gold mb-3 flex items-center gap-2">
            Gestione Utenti
          </div>

          <div className="card mb-5">
            <div className="font-rajdhani text-[14px] font-bold text-[#f0f0ff] mb-1">Crea Nuovo Utente</div>
            <p className="text-[11px] text-[#8888a8] mb-3">
              Lo username deve corrispondere al nome del giocatore nel clan. Al primo accesso l utente dovra cambiare la password.
            </p>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#8888a8] uppercase tracking-wider">Email (reale)</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    required
                    placeholder="email@esempio.com"
                    className="bg-[#0c0c1c] border border-border-gold rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#555575] focus:outline-none focus:border-cr-gold transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#8888a8] uppercase tracking-wider">Nome Clash Royale</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    required
                    placeholder="es. rigno, turin, davide..."
                    className="bg-[#0c0c1c] border border-border-gold rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#555575] focus:outline-none focus:border-cr-gold transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#8888a8] uppercase tracking-wider">Password Temp</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Min. 6 caratteri"
                    className="bg-[#0c0c1c] border border-border-gold rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#555575] focus:outline-none focus:border-cr-gold transition-colors"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#8888a8] uppercase tracking-wider">Ruolo</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as 'viewer' | 'admin')}
                    className="bg-[#0c0c1c] border border-border-gold rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-cr-gold transition-colors"
                  >
                    <option value="viewer">Membro</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="mt-4 bg-cr-gold text-[#080815] font-rajdhani font-bold text-[13px] px-4 py-2 rounded-lg hover:bg-[#f5d060] transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {creating ? '...' : 'Crea Utente'}
                </button>
              </div>
              {createMsg && (
                <div className={`text-[12px] p-2.5 rounded-lg ${createMsg.startsWith('OK') ? 'text-green-400 bg-[rgba(22,163,74,0.1)] border border-[rgba(22,163,74,0.3)]' : 'text-red-400 bg-[rgba(220,38,38,0.1)] border border-[rgba(220,38,38,0.3)]'}`}>
                  {createMsg}
                </div>
              )}
            </form>
          </div>

          <div className="card mb-6">
            <div className="font-rajdhani text-[14px] font-bold text-[#f0f0ff] mb-3">Utenti Registrati</div>
            {loadingUsers ? (
              <div className="text-[#8888a8] text-[13px]">Caricamento...</div>
            ) : users.length === 0 ? (
              <div className="text-[#8888a8] text-[13px]">Nessun utente trovato.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-2.5 bg-[#0c0c1c] border border-border-gold rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-white">{u.username}</span>
                        <span className={`badge text-[9px] ${u.role === 'admin' ? 'bg-[rgba(240,192,48,0.15)] border-[rgba(240,192,48,0.4)] text-cr-gold' : 'bg-[rgba(99,102,241,0.15)] border-[rgba(99,102,241,0.4)] text-[#a78bfa]'}`}>
                          {u.role === 'admin' ? 'Admin' : 'Membro'}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#555575] mt-0.5">
                        Creato: {new Date(u.createdAt).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleChangeRole(u.id, u.username, u.role)}
                        className="text-[11px] px-2.5 py-1 rounded border border-border-gold text-[#8888a8] hover:border-cr-gold hover:text-cr-gold transition-colors"
                        title={u.role === 'admin' ? 'Declassa a Membro' : 'Promuovi ad Admin'}
                      >
                        {u.role === 'admin' ? '↓ Declassa' : '↑ Promuovi'}
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.username)}
                        className="text-[11px] px-2.5 py-1 rounded border border-border-gold text-[#8888a8] hover:border-red-500 hover:text-red-400 transition-colors"
                        title="Elimina utente"
                      >
                        Elimina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="font-rajdhani text-[14px] font-bold text-[#8888a8] mb-2">Sistema</div>
      <div className="card">
        <p className="text-[13px] text-[#8888a8] leading-relaxed">
          Dati salvati su <strong className="text-[#f0f0ff]">Supabase</strong> - Sync automatica ogni 15 min via cron-job.org<br/>
          Autenticazione gestita da <strong className="text-[#f0f0ff]">Supabase</strong>
        </p>
      </div>
    </>
  );
}
