"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FlaskConical,
  BarChart3,
  CreditCard,
  FileClock,
  FormInput,
  LayoutDashboard,
  Shield,
  ReceiptText,
} from "lucide-react";
import { getStoredSession, hasUsableSession, logoutCurrentSession, type AuthSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { AccountMenu } from "@/components/account-menu";
import { ShellLayout, shellNavItemStyles, shellNavActiveStyles } from "./shell-layout";

const navItems = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/dashboard/forms", label: "Tự động hóa biểu mẫu", icon: FormInput },
  { href: "/dashboard/top-up", label: "Nạp credit", icon: CreditCard },
  { href: "/dashboard/usage-logs", label: "Lịch sử sử dụng", icon: FileClock },
  { href: "/dashboard/credit-transactions", label: "Giao dịch credit", icon: ReceiptText },
  { href: "/dashboard/nckh", label: "NCKH", icon: FlaskConical },
  { href: "/dashboard/ai-usage", label: "Thống kê AI", icon: BarChart3 }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    function syncSession() {
      const nextSession = getStoredSession();
      setSession(hasUsableSession() ? nextSession : null);
      if (!hasUsableSession()) {
        router.replace("/login?reason=session-expired");
      }
      setIsChecking(false);
    }

    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener("formauto-auth-session-changed", syncSession);
    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("formauto-auth-session-changed", syncSession);
    };
  }, [router]);

  async function logout() {
    await logoutCurrentSession();
    router.replace("/login");
  }

  function isActiveHref(href: string) {
    const activeItem = [...navItems]
      .sort((left, right) => right.href.length - left.href.length)
      .find((item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)));
    return activeItem?.href === href;
  }

  const navigation = (
    <nav aria-label="Điều hướng bảng điều khiển" className="space-y-1">
      {navItems.map((item) => (
        <Link
          className={cn(
            shellNavItemStyles,
            isActiveHref(item.href) && shellNavActiveStyles
          )}
          href={item.href}
          key={item.href}
          aria-current={isActiveHref(item.href) ? "page" : undefined}
          onClick={() => setIsMobileNavOpen(false)}
        >
          <item.icon className={cn("transition", isActiveHref(item.href) && "text-accent-soft")} size={18} />
          {item.label}
        </Link>
      ))}
      {session?.role === "Admin" && (
        <Link
          className={shellNavItemStyles}
          href="/admin"
          onClick={() => setIsMobileNavOpen(false)}
        >
          <Shield size={18} />
          Khu vực admin
        </Link>
      )}
    </nav>
  );

  if (isChecking) {
    return (
      <div className="app-aura-bg flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-aura-bg flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Đang chuyển về đăng nhập...
      </div>
    );
  }

  return <ShellLayout subtitle="Bảng điều khiển" navigation={navigation} mobileOpen={isMobileNavOpen} onMobileChange={setIsMobileNavOpen}
    heading={<p className="min-w-0 truncate text-xs text-secondary-foreground">Chào bạn, <strong className="text-foreground">{session.fullName}</strong></p>}
    actions={<>
      <Link href="/dashboard/top-up" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-primary transition hover:bg-primary-soft"><CreditCard aria-hidden="true" size={18} /><span className="hidden sm:inline">Nạp credit</span><span className="sr-only sm:hidden">Nạp credit</span></Link>
      <AccountMenu session={session} onLogout={logout} />
    </>}>
    {children}
  </ShellLayout>;
}
