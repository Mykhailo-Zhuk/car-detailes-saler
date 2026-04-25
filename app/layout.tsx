import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Car Parts - AI помічник", description: "Підбір автозапчастин з AI-помічником" };
export const viewport: Viewport = { themeColor: "#1a1a1a", width: "device-width", initialScale: 1, maximumScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="uk"><body>{children}</body></html>;
}
