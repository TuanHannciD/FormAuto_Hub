import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { AppToaster } from "@/components/app-toaster";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap"
});

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
      <body className={beVietnam.className}>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
