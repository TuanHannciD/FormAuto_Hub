"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Bell, Boxes, CreditCard, HelpCircle, LayoutDashboard, LogOut, Menu, Search, Settings, ShieldCheck, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getStoredSession, hasUsableSession, logoutCurrentSession, type AuthSession } from "@/lib/auth";

const navItems = [
  { href: "/admin", label: "Tổng quan admin", icon: LayoutDashboard },
  { href: "/admin/payments", label: "Thanh toán và nạp credit", icon: CreditCard },
  { href: "/admin/packages", label: "Gói credit", icon: Boxes },
  { href: "/admin/revenue", label: "Báo cáo doanh thu", icon: BarChart3 },
  { href: "/admin/payos-settings", label: "Cấu hình PayOS", icon: Settings }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const nextSession = getStoredSession();
    setSession(nextSession);
    if (!hasUsableSession()) {
      router.replace("/login?reason=session-expired");
    }
    setIsChecking(false);
  }, [router]);

  async function logout() {
    await logoutCurrentSession();
    router.replace("/login");
  }

  function isActiveHref(href: string) {
    return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  }

  const navigation = (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <Link
          className={cn(
            "group flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/70 hover:text-foreground",
            isActiveHref(item.href) && "bg-white text-primary shadow-sm ring-1 ring-primary/15"
          )}
          href={item.href}
          key={item.href}
          onClick={() => setIsMobileNavOpen(false)}
        >
          <item.icon className={cn("transition", isActiveHref(item.href) && "text-primary")} size={18} />
          {item.label}
        </Link>
      ))}
      <Link
        className="flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/70 hover:text-foreground"
        href="/dashboard"
        onClick={() => setIsMobileNavOpen(false)}
      >
        <LayoutDashboard size={18} />
        Về dashboard người dùng
      </Link>
    </nav>
  );

  if (isChecking) {
    return <div className="app-aura-bg flex min-h-screen items-center justify-center text-sm text-muted-foreground">Đang kiểm tra quyền admin...</div>;
  }

  if (!session || session.role !== "Admin") {
    return (
      <main className="app-aura-bg flex min-h-screen items-center justify-center px-5">
        <div className="glass-panel max-w-md rounded-lg p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <ShieldCheck size={22} />
          </div>
          <h1 className="text-lg font-semibold">Bạn chưa có quyền admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">Khu vực này chỉ dành cho tài khoản admin đã được phân quyền.</p>
          <Link className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/dashboard">
            Quay lại bảng điều khiển
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="app-aura-bg min-h-screen">
      <aside className="glass-sidebar fixed inset-y-0 left-0 hidden w-64 border-r px-4 py-5 lg:flex lg:flex-col">
        <div className="mb-7 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold">FormAuto Hub Admin</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        {navigation}
        <div className="mt-auto space-y-4 border-t border-border/70 pt-4">
          <Link className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/70 hover:text-foreground" href="/dashboard">
            <HelpCircle size={18} />
            Hỗ trợ kỹ thuật
          </Link>
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {session.fullName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{session.fullName}</p>
              <p className="truncate text-[11px] text-muted-foreground">{session.email}</p>
            </div>
          </div>
        </div>
      </aside>
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Đóng menu bằng lớp phủ"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setIsMobileNavOpen(false)}
            type="button"
          />
          <aside className="glass-sidebar relative flex h-full w-[min(20rem,calc(100vw-3rem))] flex-col border-r px-4 py-5 shadow-xl">
            <div className="mb-7 flex items-center justify-between gap-3 px-2">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
                  <ShieldCheck size={20} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">FormAuto Hub Admin</p>
                  <p className="truncate text-xs text-muted-foreground">Administrator</p>
                </div>
              </div>
              <Button aria-label="Đóng menu" className="min-h-9 px-3" type="button" variant="secondary" onClick={() => setIsMobileNavOpen(false)}>
                <X size={16} />
              </Button>
            </div>
            {navigation}
            <div className="mt-auto border-t border-border/70 pt-4">
              <div className="flex items-center gap-3 px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {session.fullName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{session.fullName}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{session.email}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-white/70 bg-white/78 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                aria-label="Mở menu"
                className="min-h-9 px-3 lg:hidden"
                type="button"
                variant="secondary"
                onClick={() => setIsMobileNavOpen(true)}
              >
                <Menu size={16} />
              </Button>
              <div className="min-w-0 truncate text-xs text-muted-foreground">
                <span>Admin</span>
                <span className="mx-2">/</span>
                <span className="font-medium text-primary">Quản trị hệ thống</span>
              </div>
            </div>
            <div className="flex min-w-0 shrink-0 items-center justify-end gap-2 sm:gap-3">
              <div className="relative hidden w-full max-w-sm md:block">
                <Search className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" size={15} />
                <Input disabled className="min-h-9 bg-muted/40 pl-9" placeholder="Tìm kiếm hệ thống..." />
              </div>
              <Button aria-label="Thông báo" className="hidden min-h-9 px-3 sm:inline-flex" type="button" variant="secondary">
                <Bell size={16} />
              </Button>
              <Button aria-label="Trợ giúp" className="hidden min-h-9 px-3 sm:inline-flex" type="button" variant="secondary">
                <HelpCircle size={16} />
              </Button>
              <div className="hidden text-right text-xs text-muted-foreground sm:block">
                <p className="font-medium text-foreground">{session.fullName}</p>
                <p>Admin</p>
              </div>
              <Button className="min-h-9 px-3 sm:min-h-10 sm:px-4" type="button" variant="secondary" onClick={logout}>
                <LogOut size={16} />
                <span className="ml-2 hidden sm:inline">Đăng xuất</span>
              </Button>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-5 sm:py-6">{children}</div>
      </main>
    </div>
  );
}
