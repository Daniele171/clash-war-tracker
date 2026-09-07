'use client';

import { useEffect, useState } from 'react';
import { MASTER_ADMIN_EMAIL } from '@/lib/constants';

interface AppUser {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'viewer';
  createdAt: string;
}

export default function SettingsTab() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'viewer' | 'admin'>('viewer');
  const [createMsg, setCreateMsg] = useState('');
  const [creating, setCreating] = useState(false);

  const [perms, setPerms] = useState<any>(null);
  const [isMaster, setIsMaster] = useState(false);

  const loadPerms = async () => {
    try {
      const res = await fetch('/api/permissions');
      if (res.ok) {
        const data = await res.json();
        setPerms(data.permissions);
        setIsMaster(data.isMaster);
      }
    } catch(e) {}
  };

  const handleTogglePerm = async (key: string) => {
    if (!perms) return;
    const newPerms = { ...perms, [key]: !perms[key] };
    setPerms(newPerms);
    await fetch('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPerms)
    });
  };

  const [tgToken, setTgToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [savingTg, setSavingTg] = useState(false);
  const [tgMsg, setTgMsg] = useState('');

  const loadTgSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setTgToken(data.token || '');
        setTgChatId(data.chatId || '');
      }
    } catch (e) {}
  };

  const handleSaveTg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTg(true);
    setTgMsg('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tgToken, chatId: tgChatId }),
      });
      if (res.ok) setTgMsg('OK: Salvato con successo');
      else setTgMsg('Errore nel salvataggio');
    } catch (e) {
      setTgMsg('Errore');
    }
    setSavingTg(false);
  };

  const loadUsers = () => {
    setLoadingUsers(true);
    fetch('/api/users').then(r => r.json()).then(d => {
      setUsers(Array.isArray(d) ? d : []);
      setLoadingUsers(false);
    });
  };

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.email) {
        setCurrentUserEmail(d.email);
        if (d.isMaster || d.email === MASTER_ADMIN_EMAIL) {
          loadTgSettings();
        }
      }
      if (d.role === 'admin') {
        setIsAdmin(true);
        loadUsers();
        loadPerms();
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

          {(isMaster || perms?.adminCanCreateUser) && (
            <div className="card mb-5">
              <div className="font-rajdhani text-[14px] font-bold text-[#f0f0ff] mb-1 flex items-center gap-2">
                Crea Nuovo Utente
                {isMaster && <span className="text-[10px] bg-cr-gold text-[#080815] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Master / Admin Autorizzati</span>}
              </div>
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
          )}

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
                      {u.email !== MASTER_ADMIN_EMAIL ? (
                        <>
                          {(isMaster || perms?.adminCanChangeRole) && (
                            <button
                              onClick={() => handleChangeRole(u.id, u.username, u.role)}
                              className="text-[11px] px-2.5 py-1 rounded border border-border-gold text-[#8888a8] hover:border-cr-gold hover:text-cr-gold transition-colors"
                              title={u.role === 'admin' ? 'Declassa a Membro' : 'Promuovi ad Admin'}
                            >
                              {u.role === 'admin' ? '↓ Declassa' : '↑ Promuovi'}
                            </button>
                          )}
                          {(isMaster || perms?.adminCanDeleteUser) && (
                            <button
                              onClick={() => handleDelete(u.id, u.username)}
                              className="text-[11px] px-2.5 py-1 rounded border border-border-gold text-[#8888a8] hover:border-red-500 hover:text-red-400 transition-colors"
                              title="Elimina utente"
                            >
                              Elimina
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] text-cr-gold font-bold px-2 py-1 bg-[rgba(240,192,48,0.1)] rounded border border-[rgba(240,192,48,0.3)]" title="Amministratore Assoluto intoccabile">
                          👑 Assoluto
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isMaster && (
            <>
              <div className="font-rajdhani text-[17px] font-bold text-[#facc15] mb-3 mt-8 flex items-center gap-2">
                🛡️ Centrale Operativa dei Permessi
              </div>
              <div className="card mb-6">
                <p className="text-[11px] text-[#8888a8] mb-4">
                  Decidi quali "super-poteri" concedere agli Admin. Se disattivi un'opzione, solo tu (il Master Admin) potrai eseguire quell'azione.
                </p>
                {perms ? (
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={perms.adminCanCreateUser} onChange={() => handleTogglePerm('adminCanCreateUser')} className="w-4 h-4 text-cr-gold rounded bg-[#0c0c1c] border-border-gold" />
                      <span className="text-[13px] text-white">Permetti agli Admin di creare utenti</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={perms.adminCanDeleteUser} onChange={() => handleTogglePerm('adminCanDeleteUser')} className="w-4 h-4 text-cr-gold rounded bg-[#0c0c1c] border-border-gold" />
                      <span className="text-[13px] text-white">Permetti agli Admin di eliminare utenti</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={perms.adminCanChangeRole} onChange={() => handleTogglePerm('adminCanChangeRole')} className="w-4 h-4 text-cr-gold rounded bg-[#0c0c1c] border-border-gold" />
                      <span className="text-[13px] text-white">Permetti agli Admin di promuovere/declassare utenti</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={perms.adminCanExcuse} onChange={() => handleTogglePerm('adminCanExcuse')} className="w-4 h-4 text-cr-gold rounded bg-[#0c0c1c] border-border-gold" />
                      <span className="text-[13px] text-white">Permetti agli Admin di giustificare le assenze</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={perms.adminCanForceSync} onChange={() => handleTogglePerm('adminCanForceSync')} className="w-4 h-4 text-cr-gold rounded bg-[#0c0c1c] border-border-gold" />
                      <span className="text-[13px] text-white">Permetti agli Admin di forzare la sincronizzazione (Sincronizza Ora)</span>
                    </label>
                  </div>
                ) : (
                  <div className="text-[#8888a8] text-[13px]">Caricamento permessi...</div>
                )}
              </div>
            </>
          )}

          {isMaster && (
            <>
              <div className="font-rajdhani text-[17px] font-bold text-[#14b8a6] mb-3 mt-8 flex items-center gap-2">
                🤖 Configurazione Bot Telegram
              </div>
              <div className="card mb-6">
                <p className="text-[11px] text-[#8888a8] mb-4">
                  Il bot invierà il report automatico ogni sera (se configurato su cron-job.org). Inserisci qui il token e l'ID della chat (può essere una tua chat privata o il gruppo del clan).
                </p>
                <form onSubmit={handleSaveTg} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#8888a8] uppercase tracking-wider">Bot Token (da @BotFather)</label>
                    <input
                      type="text"
                      value={tgToken}
                      onChange={e => setTgToken(e.target.value)}
                      placeholder="es. 123456789:ABCdefGHIjklmNOPqrsTUVwxyz"
                      className="bg-[#0c0c1c] border border-border-gold rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#555575] focus:outline-none focus:border-cr-gold transition-colors font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#8888a8] uppercase tracking-wider">Chat ID (Es. -1001234567 o tuo ID privato)</label>
                    <input
                      type="text"
                      value={tgChatId}
                      onChange={e => setTgChatId(e.target.value)}
                      placeholder="es. -1002391039 o 91823912"
                      className="bg-[#0c0c1c] border border-border-gold rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#555575] focus:outline-none focus:border-cr-gold transition-colors font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="submit"
                      disabled={savingTg}
                      className="bg-[#14b8a6] text-[#080815] font-rajdhani font-bold text-[13px] px-4 py-2 rounded-lg hover:bg-[#2dd4bf] transition-all disabled:opacity-50"
                    >
                      {savingTg ? 'Salvataggio...' : 'Salva Impostazioni Bot'}
                    </button>
                    {tgMsg && (
                      <span className={`text-[12px] font-semibold ${tgMsg.startsWith('OK') ? 'text-green-400' : 'text-red-400'}`}>
                        {tgMsg}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            </>
          )}
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
