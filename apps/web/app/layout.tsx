import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppToaster } from "@/components/app-toaster";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "FormAuto Hub",
  title: {
    default: "FormAuto Hub",
    template: "%s | FormAuto Hub"
  },
  description: "Bảng điều khiển vận hành FormAuto Hub",
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
