import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: "Social Garden AI Efficiency Scorecard",
  description: "Assess your organization's AI maturity and get personalized recommendations",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" />
        <script defer src="https://sg-umami.is0dbo.easypanel.host/script.js" data-website-id="27d1885e-83b4-4631-b387-9ca74b6cc477"></script>
      </head>
      <body className="font-plus-jakarta bg-sg-light-mint min-h-screen">
        {children}
      </body>
    </html>
  );
}
