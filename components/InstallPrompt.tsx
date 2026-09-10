'use client';

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showAndroidInAppPrompt, setShowAndroidInAppPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);

    // Detect OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for Chrome install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone) return null; // Don't show if already installed
  if (!isIOS && !isAndroid) return null; // Don't show on desktop

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSPrompt(true);
    } else if (isAndroid) {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      } else {
        // Android but no prompt available (likely in-app browser like Telegram/WhatsApp)
        setShowAndroidInAppPrompt(true);
      }
    }
  };

  return (
    <>
      <div className="w-full max-w-[340px] mx-auto mb-6 bg-gradient-to-r from-[rgba(240,192,48,0.15)] to-[rgba(124,58,237,0.15)] border border-cr-gold/30 rounded-xl p-4 flex items-center justify-between shadow-lg animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="text-2xl drop-shadow-[0_0_10px_rgba(240,192,48,0.6)]">📲</div>
          <div className="text-left">
            <h4 className="text-[14px] font-bold text-white font-rajdhani">App Disponibile</h4>
            <p className="text-[11px] text-[#a0a0c0]">Installa per l'esperienza nativa</p>
          </div>
        </div>
        <button
          onClick={handleInstallClick}
          className="bg-gradient-to-r from-cr-yellow to-cr-gold text-[#1a0a00] font-bold text-[12px] px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-all"
        >
          Installa
        </button>
      </div>

      {/* iOS Modal Prompt */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center p-4" style={{ background: 'rgba(8,8,21,0.85)', backdropFilter: 'blur(8px)' }} onClick={() => setShowIOSPrompt(false)}>
          <div className="bg-[#18181b] w-full max-w-[400px] rounded-t-3xl p-6 border-t border-white/10 pb-10 shadow-2xl animate-[slideUp_0.4s_cubic-bezier(0.34,1.3,0.64,1)_both]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl font-rajdhani text-white">Installa su iPhone</h3>
              <button onClick={() => setShowIOSPrompt(false)} className="text-[#8888a8] hover:text-white text-lg">✕</button>
            </div>
            <div className="flex flex-col gap-4 text-[14px] text-[#c8c8e0]">
              <p>Per installare l'App nativa su iPhone, segui questi passaggi:</p>
              <div className="flex items-center gap-3 bg-black/40 p-4 rounded-xl border border-white/5">
                <span className="text-2xl">1️⃣</span>
                <span>Tocca l'icona <strong>Condividi</strong> in basso al centro (quadratino con freccia).</span>
              </div>
              <div className="flex items-center gap-3 bg-black/40 p-4 rounded-xl border border-white/5">
                <span className="text-2xl">2️⃣</span>
                <span>Scorri verso il basso e tocca <strong>"Aggiungi alla schermata Home"</strong> ⊞.</span>
              </div>
            </div>
            <button onClick={() => setShowIOSPrompt(false)} className="w-full mt-6 bg-white/10 text-white font-bold py-3.5 rounded-xl hover:bg-white/20 transition-all">
              Ho capito
            </button>
          </div>
        </div>
      )}

      {/* Android In-App Browser Warning Modal */}
      {showAndroidInAppPrompt && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center p-4" style={{ background: 'rgba(8,8,21,0.85)', backdropFilter: 'blur(8px)' }} onClick={() => setShowAndroidInAppPrompt(false)}>
          <div className="bg-[#18181b] w-full max-w-[400px] rounded-t-3xl p-6 border-t border-white/10 pb-10 shadow-2xl animate-[slideUp_0.4s_cubic-bezier(0.34,1.3,0.64,1)_both]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl font-rajdhani text-white">Installazione Manuale</h3>
              <button onClick={() => setShowAndroidInAppPrompt(false)} className="text-[#8888a8] hover:text-white text-lg">✕</button>
            </div>
            <div className="flex flex-col gap-4 text-[13px] text-[#c8c8e0]">
              <p>Il download automatico è bloccato dal tuo browser o dall'app da cui hai aperto il link.</p>
              <p className="text-cr-gold font-bold">Come installare su Android:</p>
              <div className="flex items-start gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="text-xl mt-0.5">1️⃣</span>
                <span>Se sei dentro un'app (es. WhatsApp), clicca sul menù in alto a destra e fai <strong>"Apri nel browser"</strong> (es. Chrome).</span>
              </div>
              <div className="flex items-start gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="text-xl mt-0.5">2️⃣</span>
                <span>Dal tuo browser, apri il menù principale (di solito 3 puntini in alto o 3 lineette in basso).</span>
              </div>
              <div className="flex items-start gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="text-xl mt-0.5">3️⃣</span>
                <span>Cerca e clicca su <strong>"Installa app"</strong> oppure <strong>"Aggiungi a schermata Home"</strong>.</span>
              </div>
              <p className="text-xs text-[#8888a8] italic text-center mt-2">(La dicitura e i passaggi esatti possono variare in base alla marca del telefono e al browser usato).</p>
            </div>
            <button onClick={() => setShowAndroidInAppPrompt(false)} className="w-full mt-6 bg-white/10 text-white font-bold py-3.5 rounded-xl hover:bg-white/20 transition-all border border-white/5">
              Ho capito
            </button>
          </div>
        </div>
      )}
    </>
  );
}
