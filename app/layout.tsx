import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Sanctions Tracker — AI Vortex",
  description: "Real-time tracking of AI-related court sanctions against attorneys. 1,294+ cases tracked. Find out where your firm is exposed.",
  icons: {
    icon: [
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "AI Sanctions Tracker — AI Vortex",
    description: "1,294+ tracked rulings. $145K+ in Q1 sanctions. Courts are actively hunting for AI hallucinations. Is your firm exposed?",
    url: "https://www.aivortex.io/sanctions",
    siteName: "AI Vortex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Sanctions Tracker — AI Vortex",
    description: "1,294+ tracked rulings. Where is your firm exposed?",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen bg-[#050B14] text-white antialiased`}>
        {/* Global ambient background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#0066FF]/[0.04] blur-[150px]" />
          <div className="absolute top-[40%] right-[-10%] w-[30%] h-[50%] rounded-full bg-[#0066FF]/[0.03] blur-[150px]" />
          <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[30%] rounded-full bg-[#0066FF]/[0.02] blur-[120px]" />
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='20' cy='20' r='0.5' fill='rgba(255,255,255,0.08)'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
