"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Bell, Boxes, CreditCard, HelpCircle, LayoutDashboard, LogOut, Search, Settings, ShieldCheck } from "lucide-react";
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

  if (isChecking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Đang kiểm tra quyền admin...</div>;
  }

  if (!session || session.role !== "Admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="max-w-md rounded-lg border border-border bg-white p-6 text-center shadow-soft">
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
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-white px-4 py-5 lg:flex lg:flex-col">
        <div className="mb-7 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold">FormAuto Hub Admin</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                pathname === item.href && "bg-primary/10 text-primary"
              )}
              href={item.href}
              key={item.href}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
          <Link
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            href="/dashboard"
          >
            <LayoutDashboard size={18} />
            Về dashboard người dùng
          </Link>
        </nav>
        <div className="mt-auto space-y-4 border-t border-border pt-4">
          <Link className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground" href="/dashboard">
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
      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-border bg-white/95 px-5 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              <span>Admin</span>
              <span className="mx-2">/</span>
              <span className="font-medium text-primary">Phase 8</span>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
              <div className="relative hidden w-full max-w-sm md:block">
                <Search className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" size={15} />
                <Input disabled className="min-h-9 bg-muted/40 pl-9" placeholder="Tìm kiếm hệ thống..." />
              </div>
              <Button aria-label="Thông báo" className="min-h-9 px-3" type="button" variant="secondary">
                <Bell size={16} />
              </Button>
              <Button aria-label="Trợ giúp" className="min-h-9 px-3" type="button" variant="secondary">
                <HelpCircle size={16} />
              </Button>
              <div className="hidden text-right text-xs text-muted-foreground sm:block">
                <p className="font-medium text-foreground">{session.fullName}</p>
                <p>Admin</p>
              </div>
              <Button type="button" variant="secondary" onClick={logout}>
                <LogOut size={16} />
                <span className="ml-2">Đăng xuất</span>
              </Button>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-5 py-6">{children}</div>
      </main>
    </div>
  );
}
