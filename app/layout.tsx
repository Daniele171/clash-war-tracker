import type { Metadata } from "next";
import { Rajdhani, Outfit } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({ 
  subsets: ["latin"], 
  weight: ["500", "600", "700"],
  variable: "--font-rajdhani",
});

const outfit = Outfit({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "War Tracker — Clan Clash Royale",
  description: "Traccia la partecipazione del tuo clan alle Clan War di Clash Royale.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${rajdhani.variable} ${outfit.variable} font-outfit bg-[#080815] text-[#f0f0ff] min-h-screen overflow-x-hidden antialiased relative`}>
        {/* Background glow effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-[20%] w-[80%] h-[50%] bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.14)_0%,transparent_60%)]"></div>
          <div className="absolute bottom-0 right-[-20%] w-[60%] h-[40%] bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.11)_0%,transparent_60%)]"></div>
          <div className="absolute top-[25%] left-[25%] w-[40%] h-[60%] bg-[radial-gradient(ellipse_at_center,rgba(240,192,48,0.04)_0%,transparent_70%)]"></div>
        </div>
        
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
