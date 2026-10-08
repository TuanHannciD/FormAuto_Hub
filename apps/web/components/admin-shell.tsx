"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Bell, Bot, Boxes, CreditCard, HandCoins, HelpCircle, LayoutDashboard, Search, Settings, ShieldCheck } from "lucide-react";
import { AccountMenu } from "@/components/account-menu";
import { ShellLayout, shellNavItemStyles, shellNavActiveStyles } from "./shell-layout";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getStoredSession, hasUsableSession, logoutCurrentSession, type AuthSession } from "@/lib/auth";

const navItems = [
  { href: "/admin", label: "Tổng quan admin", icon: LayoutDashboard },
  { href: "/admin/payments", label: "Thanh toán và nạp credit", icon: CreditCard },
  { href: "/admin/manual-credits", label: "Đối soát thủ công", icon: HandCoins },
  { href: "/admin/packages", label: "Gói credit", icon: Boxes },
  { href: "/admin/revenue", label: "Báo cáo doanh thu", icon: BarChart3 },
  { href: "/admin/payos-settings", label: "Cấu hình PayOS", icon: Settings },
  { href: "/admin/ai-provider-settings", label: "Cấu hình AI", icon: Bot },
  { href: "/admin/ai-usage", label: "Thống kê AI", icon: BarChart3 }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    function syncSession() {
      setSession(hasUsableSession() ? getStoredSession() : null);
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
    return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  }

  const navigation = (
    <nav aria-label="Điều hướng quản trị" className="space-y-1">
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
      <Link
        className={shellNavItemStyles}
        href="/dashboard"
        onClick={() => setIsMobileNavOpen(false)}
      >
        <LayoutDashboard size={18} />
        Về dashboard người dùng
      </Link>
    </nav>
  );

  if (isChecking) {
    return <div className="flex min-h-dvh items-center justify-center bg-surface-subtle text-sm text-muted-foreground">Đang kiểm tra quyền admin...</div>;
  }

  if (!session || session.role !== "Admin") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-surface-subtle px-5">
        <div className="max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-soft">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning-surface text-warning">
            <ShieldCheck size={22} />
          </div>
          <h1 className="text-lg font-semibold">Bạn chưa có quyền admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">Khu vực này chỉ dành cho tài khoản admin đã được phân quyền.</p>
          <Link className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/dashboard">
            Quay lại bảng điều khiển
          </Link>
        </div>
      </main>
    );
  }

  return <ShellLayout subtitle="Quản trị hệ thống" navigation={navigation} mobileOpen={isMobileNavOpen} onMobileChange={setIsMobileNavOpen}
    heading={<p className="min-w-0 truncate text-xs text-secondary-foreground"><span>Admin</span><span className="mx-2">/</span><strong className="text-foreground">{navItems.find(item => isActiveHref(item.href))?.label || "Quản trị hệ thống"}</strong></p>}
    actions={<>
      <div className="relative hidden w-48 xl:block"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 text-muted-foreground" size={16} /><Input disabled className="pl-9" placeholder="Tìm kiếm hệ thống..." /></div>
      <Button aria-label="Thông báo" className="hidden sm:inline-flex" size="icon" type="button" variant="secondary"><Bell aria-hidden="true" size={18} /></Button>
      <Button aria-label="Trợ giúp" className="hidden sm:inline-flex" size="icon" type="button" variant="secondary"><HelpCircle aria-hidden="true" size={18} /></Button>
      <AccountMenu session={session} onLogout={logout} />
    </>}>
    {children}
  </ShellLayout>;
}
