'use client';

export default function SettingsTab() {
  return (
    <>
      <div className="mb-6">
        <div className="font-rajdhani text-[13px] font-bold text-[#8888a8] uppercase tracking-[1px] mb-2.5 pb-1.5 border-b border-border-gold">Backend Vercel</div>
        <div className="card">
          <p className="text-[13px] text-[#f0f0ff] mb-4 leading-relaxed">
            I dati sono salvati su <strong>Vercel KV</strong> e sincronizzati automaticamente tramite cron job.<br/>
            Le configurazioni (API Key, Clan Tag) devono essere impostate come variabili d'ambiente nel server Vercel:
          </p>
          <div className="bg-[#0c0c1c] border border-border-gold rounded-lg p-3 font-mono text-[11px] text-[#8888a8]">
            CLAN_TAG="#YOURTAG"<br/>
            CR_API_KEY="ey..."<br/>
            CRON_SECRET="your_secret_password"<br/>
            KV_REST_API_URL="..."<br/>
            KV_REST_API_TOKEN="..."
          </div>
          <div className="mt-4 p-2.5 bg-[rgba(37,99,235,0.1)] border border-[rgba(37,99,235,0.3)] text-[#60a5fa] text-[12px] rounded-lg">
            ℹ️ Questa è la versione Backend. Tutte le modifiche vengono applicate a livello server.
          </div>
        </div>
      </div>
    </>
  );
}
