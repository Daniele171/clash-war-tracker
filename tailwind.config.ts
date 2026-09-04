import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          0: '#080815',
          1: '#0f0f20',
          2: '#1a1a30',
          card: 'rgba(255,255,255,0.04)',
          'card-h': 'rgba(255,255,255,0.07)',
        },
        cr: {
          gold: '#f0c030',
          purple: '#7c3aed',
          blue: '#2563eb',
          red: '#dc2626',
          green: '#16a34a',
          orange: '#ea580c',
          yellow: '#d97706',
        },
        border: {
          gold: 'rgba(240,192,48,0.18)',
          'gold-strong': 'rgba(240,192,48,0.5)',
        }
      },
      fontFamily: {
        rajdhani: ['var(--font-rajdhani)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 24px rgba(240,192,48,0.22)',
      }
    },
  },
  plugins: [],
};
export default config;
