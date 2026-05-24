"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ClipboardCheck,
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
  { href: "/dashboard/profile", label: "Hồ sơ", icon: Settings },
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
      setSession(nextSession);
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
    return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
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
      {session?.role === "Admin" && (
        <Link
          className={cn(
            "group flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/70 hover:text-foreground",
            pathname.startsWith("/admin") && "bg-white text-primary shadow-sm ring-1 ring-primary/15"
          )}
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

  return (
    <div className="app-aura-bg min-h-screen">
      <aside className="glass-sidebar fixed inset-y-0 left-0 hidden w-72 border-r px-4 py-5 lg:block">
        <div className="mb-7 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold">FormAuto Hub</p>
            <p className="text-xs text-muted-foreground">Bảng điều khiển vận hành</p>
          </div>
        </div>
        {navigation}
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
                  <ClipboardCheck size={20} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">FormAuto Hub</p>
                  <p className="truncate text-xs text-muted-foreground">Bảng điều khiển vận hành</p>
                </div>
              </div>
              <Button aria-label="Đóng menu" className="min-h-9 px-3" type="button" variant="secondary" onClick={() => setIsMobileNavOpen(false)}>
                <X size={16} />
              </Button>
            </div>
            {navigation}
          </aside>
        </div>
      )}
      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-white/70 bg-white/78 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-5 sm:py-4">
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
                <span>Dashboard</span>
                <span className="mx-2">/</span>
                <span className="font-medium text-primary">Bảng điều khiển vận hành</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden text-right text-xs text-muted-foreground sm:block">
                <p className="font-medium text-foreground">{session?.fullName ?? "Người dùng FormAuto"}</p>
                <p>{session?.email ?? ""}</p>
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
