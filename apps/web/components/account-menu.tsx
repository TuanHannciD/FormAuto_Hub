"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import type { AuthSession } from "@/lib/auth";
import { Button } from "./ui";
import { AccountDialog } from "./account-dialog";

export function AccountMenu({ session, onLogout }: { session: AuthSession; onLogout: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await onLogout(); } finally { setLoggingOut(false); }
  }

  return (
    <><div ref={container} className="relative shrink-0" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }} onKeyDown={event => {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    }}>
      <button ref={trigger} type="button" aria-label="Menu tài khoản" aria-expanded={open} aria-controls={id}
        onClick={() => setOpen(value => !value)}
        className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface p-1.5 text-sm hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft font-bold text-primary">{(session.fullName || session.email || "F").slice(0, 1).toLocaleUpperCase("vi-VN")}</span>
        <span className="hidden max-w-36 truncate text-xs font-semibold sm:block">{session.fullName || session.email}</span>
        <ChevronDown aria-hidden="true" size={14} />
      </button>
      {open && (
        <div id={id} className="absolute right-0 z-50 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-surface p-2 shadow-soft">
          <div className="border-b border-border px-3 py-3">
            <p className="break-words text-sm font-semibold">{session.fullName}</p>
            <p className="mt-1 break-all text-xs text-secondary-foreground">{session.email}</p>
          </div>
          <nav aria-label="Menu tài khoản" className="pt-2">
            <button type="button" onClick={() => { setOpen(false); trigger.current?.focus(); setAccountOpen(true); }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Settings aria-hidden="true" size={17} />Quản lý tài khoản
            </button>
            <Button variant="secondary" className="mt-1 w-full justify-start border-0 text-destructive shadow-none" onClick={logout} disabled={loggingOut}>
              <LogOut aria-hidden="true" size={17} />{loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </Button>
          </nav>
        </div>
      )}
    </div>
      {accountOpen && <AccountDialog onClose={() => setAccountOpen(false)} onLogout={onLogout} />}
    </>
  );
}
