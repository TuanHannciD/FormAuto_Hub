"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useRef, type MouseEvent } from "react";

const navigationItems = [
  ["#top", "Trang chủ"],
  ["#dich-vu", "Dịch vụ"],
  ["#cach-hoat-dong", "Cách hoạt động"],
  ["#bang-gia", "Bảng giá"],
  ["/google-forms/sample-data", "Hướng dẫn"],
  ["#faq", "FAQ"]
] as const;

export function MobileNavigation() {
  const menu = useRef<HTMLDetailsElement>(null);

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (menu.current) {
      menu.current.open = false;
      menu.current.querySelector("summary")?.focus({ preventScroll: true });
    }
    const href = event.currentTarget.getAttribute("href");
    if (!href?.startsWith("#")) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    event.preventDefault();
    if (location.hash !== href) history.pushState(null, "", href);
    target.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start"
    });
  }

  return (
    <details ref={menu} className="group relative ml-auto md:hidden">
      <summary
        className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-lg hover:bg-surface-subtle focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary [&::-webkit-details-marker]:hidden"
        aria-controls="mobile-navigation"
      >
        <Menu className="group-open:hidden" aria-hidden="true" />
        <X className="hidden group-open:block" aria-hidden="true" />
        <span className="sr-only group-open:hidden">Mở menu</span>
        <span className="sr-only hidden group-open:block">Đóng menu</span>
      </summary>
        <nav
          id="mobile-navigation"
          className="absolute right-[-20px] top-[55px] flex max-h-[calc(100dvh-5rem)] w-screen flex-col gap-1 overflow-y-auto border-b border-border bg-surface px-5 py-4 text-sm font-semibold text-secondary-foreground shadow-raised [&>a]:flex [&>a]:min-h-11 [&>a]:items-center"
          aria-label="Điều hướng mobile"
        >
          {navigationItems.map(([href, label]) => (
            <Link href={href} key={href} onClick={navigate}>{label}</Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-3 border-t border-border pt-3 [&>a]:flex [&>a]:min-h-11 [&>a]:items-center [&>a]:justify-center [&>a]:rounded-lg [&>a]:focus-visible:outline [&>a]:focus-visible:outline-3 [&>a]:focus-visible:outline-primary">
            <Link className="border border-border" href="/login" onClick={navigate}>Đăng nhập</Link>
            <Link className="bg-primary px-3 text-inverse-foreground hover:bg-primary-hover" href="/register" onClick={navigate}>Đăng ký</Link>
          </div>
        </nav>
    </details>
  );
}
