import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Car Parts - AI помічник", description: "Підбір автозапчастин з AI-помічником" };
export const viewport: Viewport = { themeColor: "#1a1a1a", width: "device-width", initialScale: 1, maximumScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <head>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co wss://*.supabase.co;" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
      </head>
      <body>{children}</body>
    </html>
  );
}
