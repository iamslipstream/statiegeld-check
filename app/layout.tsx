import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bottle Return Check — Jumbo & Vomar machines",
  description:
    "Crowdsourced status of the bottle & can return (statiegeld) machines at the Jumbo and Vomar near Our Domain South East, Amsterdam. Check before you carry your bottles and cans down.",
  applicationName: "Bottle Return Check",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bottle Return Check",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
