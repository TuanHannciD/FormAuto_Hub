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
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { getStoredSession, hasUsableSession, logoutCurrentSession, type AuthSession } from "@/lib/auth";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/dashboard/forms", label: "Tự động hóa biểu mẫu", icon: FormInput },
  { href: "/dashboard/top-up", label: "Nạp credit", icon: CreditCard },
  { href: "/dashboard/usage-logs", label: "Lịch sử sử dụng", icon: FileClock },
  { href: "/dashboard/credit-transactions", label: "Giao dịch credit", icon: ReceiptText },
  { href: "/dashboard/nckh", label: "NCKH", icon: FlaskConical },
  { href: "/dashboard/profile", label: "Hồ sơ", icon: Settings },
  { href: "/dashboard/ai-usage", label: "Thống kê AI", icon: BarChart3 },
  { href: "/dashboard/profile/security", label: "Bảo mật", icon: ShieldCheck }
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
            "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-inverse-muted transition hover:bg-inverse-foreground/10 hover:text-inverse-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            isActiveHref(item.href) && "bg-primary/35 text-inverse-foreground"
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
          className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-inverse-muted hover:bg-inverse-foreground/10 hover:text-inverse-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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

  const brand = (
    <Link href="/" className="flex min-h-11 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
      <span aria-hidden="true" className="grid h-[34px] w-[34px] shrink-0 grid-cols-3 items-end gap-0.5 rounded-[10px] bg-primary p-[7px]">
        <span className="h-[42%] rounded-sm bg-inverse-foreground/75" /><span className="h-[68%] rounded-sm bg-inverse-foreground/90" /><span className="h-full rounded-sm bg-inverse-foreground" />
      </span>
      <span className="min-w-0"><strong className="block text-[13px] font-extrabold">FormAuto Hub</strong><span className="block text-[11px] text-inverse-muted">Bảng điều khiển</span></span>
    </Link>
  );
  const account = (
    <div className="mt-auto border-t border-inverse-foreground/15 pt-4">
      <div className="flex items-center gap-3 px-1">
        <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold">{(session.fullName || "F").slice(0, 1).toLocaleUpperCase("vi-VN")}</span>
        <div className="min-w-0"><p className="truncate text-xs font-semibold">{session.fullName}</p><p className="mt-1 truncate text-[11px] text-inverse-muted">{session.email}</p></div>
      </div>
      <Button type="button" onClick={logout} className="mt-3 w-full justify-start gap-3 rounded-xl bg-transparent text-inverse-muted shadow-none hover:bg-inverse-foreground/10 hover:text-inverse-foreground"><LogOut aria-hidden="true" size={18} />Đăng xuất</Button>
    </div>
  );
  return (
    <div className="min-h-dvh bg-surface-subtle">
      <aside className="fixed inset-y-4 left-4 z-20 hidden w-[244px] flex-col gap-7 overflow-y-auto rounded-2xl bg-surface-inverse px-[18px] py-6 text-inverse-foreground shadow-soft lg:flex">
        {brand}{navigation}{account}
      </aside>
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-40 p-3 lg:hidden">
          <button type="button" aria-label="Đóng menu bằng lớp phủ" className="absolute inset-0 bg-overlay/50" onClick={() => setIsMobileNavOpen(false)} />
          <aside aria-label="Menu di động" className="relative flex h-full w-[min(290px,84vw)] flex-col gap-6 overflow-y-auto rounded-2xl bg-surface-inverse px-[18px] py-5 text-inverse-foreground shadow-soft">
            <div className="flex items-center justify-between gap-2">{brand}<button type="button" aria-label="Đóng menu" onClick={() => setIsMobileNavOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-inverse-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X aria-hidden="true" size={18} /></button></div>
            {navigation}{account}
          </aside>
        </div>
      )}
      <main className="min-w-0 pt-4 lg:pl-[260px]">
        <header className="sticky top-4 z-10 mx-4 flex min-h-[76px] items-center justify-between gap-3 rounded-2xl border border-border bg-surface/95 px-4 shadow-soft backdrop-blur sm:mx-6 sm:px-6 xl:mx-12">
          <div className="flex min-w-0 items-center gap-3">
            <Button type="button" variant="secondary" aria-label="Mở menu" className="h-10 w-10 shrink-0 rounded-xl px-0 lg:hidden" onClick={() => setIsMobileNavOpen(true)}><Menu aria-hidden="true" size={20} /></Button>
            <p className="min-w-0 truncate text-xs text-secondary-foreground">Chào bạn, <strong className="text-foreground">{session.fullName}</strong></p>
          </div>
          <Link href="/dashboard/top-up" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-primary transition hover:bg-primary-soft"><CreditCard aria-hidden="true" size={18} />Nạp credit</Link>
        </header>
        <div className="mx-auto w-full max-w-[1260px] px-4 py-8 sm:px-6 sm:py-[42px] xl:px-12">{children}</div>
      </main>
    </div>
  );
}
