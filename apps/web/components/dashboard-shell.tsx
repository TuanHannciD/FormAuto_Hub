import Link from "next/link";
import {
  ClipboardCheck,
  CreditCard,
  FileClock,
  FormInput,
  LayoutDashboard,
  ReceiptText,
  Settings
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/dashboard/forms", label: "Form automation", icon: FormInput },
  { href: "/dashboard/top-up", label: "Nạp credit", icon: CreditCard },
  { href: "/dashboard/usage-logs", label: "Lịch sử sử dụng", icon: FileClock },
  { href: "/dashboard/credit-transactions", label: "Giao dịch credit", icon: ReceiptText },
  { href: "/dashboard/profile", label: "Hồ sơ", icon: Settings }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border bg-white px-4 py-5 lg:block">
        <div className="mb-7 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold">FormAuto Hub</p>
            <p className="text-xs text-muted-foreground">Dashboard vận hành</p>
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              href={item.href}
              key={item.href}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-border bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phase 5 dashboard</p>
              <h1 className="text-lg font-semibold">FormAuto Hub</h1>
            </div>
            <div className="rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
              Dev user context header đang dùng cho MVP
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-5 py-6">{children}</div>
      </main>
    </div>
  );
}
