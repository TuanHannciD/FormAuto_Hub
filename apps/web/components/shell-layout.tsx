"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "./ui";

export const shellNavItemStyles = "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-inverse-muted transition hover:bg-inverse-foreground/10 hover:text-inverse-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
export const shellNavActiveStyles = "bg-primary/35 text-inverse-foreground";

function ShellBrand({ subtitle }: { subtitle: string }) {
  return <Link href="/" className="group flex min-w-0 min-h-11 items-center gap-2.5 rounded-xl text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:gap-3">
    <span aria-hidden="true" className="grid h-11 w-11 shrink-0 grid-cols-3 items-end gap-0.5 rounded-2xl bg-primary p-2.5 shadow-soft ring-4 ring-primary/10 transition-colors group-hover:bg-primary-hover lg:h-12 lg:w-12">
      <span className="h-[42%] rounded-sm bg-inverse-foreground/75" /><span className="h-[68%] rounded-sm bg-inverse-foreground/90" /><span className="h-full rounded-sm bg-inverse-foreground" />
    </span>
    <span className="min-w-0"><strong className="block whitespace-nowrap text-base font-extrabold tracking-tight lg:text-[17px]">FormAuto <span className="text-primary">Hub</span></strong><span className="mt-0.5 block text-[11px] font-medium text-secondary-foreground">{subtitle}</span></span>
  </Link>;
}

export function ShellLayout({ children, navigation, subtitle, heading, actions, mobileOpen, onMobileChange }: {
  children: ReactNode; navigation: ReactNode; subtitle: string; heading: ReactNode; actions: ReactNode;
  mobileOpen: boolean; onMobileChange: (open: boolean) => void;
}) {
  return <div className="min-h-dvh bg-surface-subtle">
    <div className="fixed inset-y-4 left-4 z-20 hidden w-[244px] flex-col gap-3 lg:flex">
      <div className="flex h-[76px] shrink-0 items-center rounded-2xl border border-primary-border bg-primary-soft/60 px-[18px] shadow-soft ring-1 ring-primary/10"><ShellBrand subtitle={subtitle} /></div>
      <aside className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-surface-inverse px-[18px] py-5 text-inverse-foreground shadow-soft">
        {navigation}
      </aside>
    </div>
    {mobileOpen && <div className="fixed inset-0 z-40 p-3 lg:hidden">
      <button type="button" aria-label="Đóng menu bằng lớp phủ" className="absolute inset-0 bg-overlay/50" onClick={() => onMobileChange(false)} />
      <div className="relative flex h-full w-[min(290px,84vw)] flex-col gap-3">
        <div className="flex shrink-0 items-center justify-between gap-2 rounded-2xl border border-primary-border bg-primary-soft px-4 py-3 shadow-soft ring-1 ring-primary/10"><ShellBrand subtitle={subtitle} /><Button type="button" variant="secondary" size="icon" aria-label="Đóng menu" onClick={() => onMobileChange(false)}><X aria-hidden="true" size={18} /></Button></div>
        <aside aria-label="Menu di động" className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-surface-inverse px-[18px] py-5 text-inverse-foreground shadow-soft">
          {navigation}
        </aside>
      </div>
    </div>}
    <main className="min-w-0 pt-4 lg:pl-[260px]">
      <header className="sticky top-4 z-10 mx-4 flex min-h-[76px] items-center justify-between gap-3 rounded-2xl border border-border bg-surface/95 px-4 shadow-soft backdrop-blur sm:mx-6 sm:px-6 xl:mx-12">
        <div className="flex min-w-0 items-center gap-3">
          <Button type="button" variant="secondary" aria-label="Mở menu" className="h-10 w-10 shrink-0 rounded-xl px-0 lg:hidden" onClick={() => onMobileChange(true)}><Menu aria-hidden="true" size={20} /></Button>
          {heading}
        </div>
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      </header>
      <div className="mx-auto w-full max-w-[1260px] px-4 py-8 sm:px-6 sm:py-[42px] xl:px-12">{children}</div>
    </main>
  </div>;
}
