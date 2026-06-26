import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Our Domain Community — South East",
  description:
    "Two tools for Our Domain South East residents: a neighbours' marketplace to buy and sell second-hand items, and live bottle return machine status for Jumbo and Vomar.",
  applicationName: "Our Domain Community",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OD Community",
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
    <html lang="en" className="scroll-smooth">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
