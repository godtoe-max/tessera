import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tessera | Client Service Desk",
  description: "A unified client service workspace for consulting teams.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
