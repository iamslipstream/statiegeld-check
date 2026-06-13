import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Statiegeld Check — Jumbo bottle & can machine",
  description:
    "Crowdsourced status of the statiegeld (deposit) machine at our Jumbo. Check before you carry your bottles and cans down.",
  applicationName: "Statiegeld Check",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Statiegeld Check",
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
