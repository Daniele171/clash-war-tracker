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

export const viewport = {
  themeColor: "#080815",
};

export const metadata: Metadata = {
  title: "War Tracker — Clan Clash Royale",
  description: "Traccia la partecipazione del tuo clan alle Clan War di Clash Royale.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "War Tracker",
  }};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${rajdhani.variable} ${outfit.variable} font-outfit bg-[#080815] text-[#f0f0ff] min-h-screen overflow-x-hidden antialiased relative`}>
        {/* Background glow effects */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#05050f]">
          {/* Enhanced bright ambient glows for glassmorphism */}
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-cr-purple/30 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{animationDuration: "8s"}}></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-cr-gold/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{animationDuration: "12s", animationDelay: "2s"}}></div>
          <div className="absolute top-[30%] left-[40%] w-[40vw] h-[40vw] bg-cr-blue/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{animationDuration: "10s", animationDelay: "4s"}}></div>
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
          
          
          
        </div>
        
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
