import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoodStart｜員工體重管理平台",
  description: "院內員工體重管理班的本機示範平台。",
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
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
