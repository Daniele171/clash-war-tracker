import { useEffect } from 'react';

export default function Toast({ message, type, onDone }: { message: string; type: 'success' | 'info' | 'error'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  const colors = {
    success: 'border-[rgba(22,163,74,0.5)] bg-[rgba(22,163,74,0.12)] text-[#4ade80]',
    info: 'border-[rgba(37,99,235,0.5)] bg-[rgba(37,99,235,0.12)] text-[#60a5fa]',
    error: 'border-[rgba(220,38,38,0.5)] bg-[rgba(220,38,38,0.12)] text-[#f87171]',
  };

  return (
    <div
      className={`fixed bottom-[72px] left-1/2 -translate-x-1/2 z-[180] px-4 py-2.5 rounded-xl border text-[13px] font-semibold shadow-lg animate-[slideUp_0.3s_ease] whitespace-nowrap ${colors[type]}`}
    >
      {message}
    </div>
  );
}