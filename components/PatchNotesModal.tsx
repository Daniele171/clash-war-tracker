'use client';

export const APP_VERSION = 'v3.0';

const PATCH_NOTES = [
  { icon: '📱', text: 'Nuova App Nativa (PWA): Ora puoi scaricare il sito come una vera App su Android e iPhone per un\'esperienza a schermo intero!' },
  { icon: '✨', text: 'Nuova Veste Grafica: Design "serio" e pulito. Addio neon e grafiche eccessive, benvenuta fluidità professionale.' },
  { icon: '🌅', text: 'Nuovo Messaggio Bot: "Avviso Inizio Giornata". Il bot ora avvisa automaticamente se è il giorno di Allenamento o di Battaglia appena inizia la nuova giornata di guerra!' }
];

export default function PatchNotesModal({ onDone }: { onDone: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[190] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(8,8,21,0.7)', backdropFilter: 'blur(8px)' }}
    >
      <div className="relative w-full max-w-[400px] rounded-2xl border border-[rgba(124,58,237,0.4)] bg-[rgba(12,12,28,0.98)] shadow-[0_0_60px_rgba(124,58,237,0.2)] animate-[slideUp_0.4s_cubic-bezier(0.34,1.3,0.64,1)_both]">
        <div className="absolute top-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-[rgba(124,58,237,0.7)] to-transparent" />

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-[28px]">🚀</div>
            <div>
              <div className="font-rajdhani text-[20px] font-bold text-white">Novità {APP_VERSION}</div>
              <div className="text-[11px] text-[#8888a8]">Aggiornamento · 6 Settembre 2026</div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 mb-6">
            {PATCH_NOTES.map((note, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 text-[13px] text-[#c8c8e0]"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <span className="text-[16px] shrink-0 mt-[-1px]">{note.icon}</span>
                <span>{note.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onDone}
            className="w-full btn btn-primary py-3 text-[14px] justify-center"
          >
            ✅ Ho capito, andiamo!
          </button>
        </div>
      </div>
    </div>
  );
}