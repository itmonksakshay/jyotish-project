import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jyotisha 3D - Educational Vedic Astrology & Orbital Simulator",
  description: "A self-contained, interactive WebGL 3D simulator demonstrating Keplerian planetary orbits and Vedic astrology calculations from scratch.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="dark h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-white selection:bg-indigo-500/30">
        {children}
      </body>
    </html>
  );
}
