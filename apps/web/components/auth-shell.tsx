import Link from "next/link";
import { Coins, FileCheck2, ShieldCheck } from "lucide-react";

export function AuthShell({ mode, children }: { mode: "login" | "register" | "callback"; children: React.ReactNode }) {
  const isRegister = mode === "register";
  return (
    <main className="grid min-h-dvh bg-surface min-[921px]:grid-cols-[minmax(380px,.86fr)_minmax(0,1.14fr)]">
      <section className="relative flex flex-col overflow-hidden bg-surface-inverse px-5 py-7 text-inverse-foreground sm:px-6 min-[921px]:min-h-dvh min-[921px]:p-[clamp(32px,5vw,76px)]" aria-label="Giới thiệu sản phẩm">
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-[260px] -right-[300px] h-[560px] w-[560px] rounded-full border-[90px] border-accent/10" />
        <Link href="/" aria-label="FormAuto Hub — Trang chủ" className="relative inline-flex w-fit items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <span aria-hidden="true" className="grid h-[34px] w-[34px] grid-cols-3 items-end gap-0.5 rounded-[10px] bg-primary p-[7px] shadow-soft">
            <span className="h-[42%] rounded-sm bg-inverse-foreground/75" /><span className="h-[68%] rounded-sm bg-inverse-foreground/90" /><span className="h-full rounded-sm bg-inverse-foreground" />
          </span>
          <strong className="text-[15px] font-extrabold tracking-tight">FormAuto Hub</strong>
        </Link>
        <div className="relative mt-10 max-w-[610px] min-[921px]:my-auto min-[921px]:py-12">
          <h1 className="max-w-[12ch] text-[38px] font-bold leading-[1.01] tracking-[-.035em] sm:text-[44px] min-[921px]:max-w-[9ch] min-[921px]:text-[clamp(48px,5vw,78px)]">
            {isRegister ? "Bắt đầu với form của bạn." : mode === "callback" ? "Sẵn sàng tiếp tục công việc." : "Quay lại phần việc đang làm."}
          </h1>
          <p className="mt-4 max-w-[52ch] text-sm leading-7 text-inverse-muted sm:mt-6 min-[921px]:text-base">
            {isRegister ? "Tạo tài khoản để nhận 5 credit, chuẩn bị phản hồi và xem lại trước khi xác nhận gửi." : "Đăng nhập để tiếp tục thiết lập câu trả lời, kiểm tra credit và theo dõi những lần tạo gần đây."}
          </p>
          <div className="mt-10 hidden max-w-[470px] border-t border-inverse-foreground/15 min-[921px]:block" aria-label="Điểm mạnh của tài khoản">
            {[
              { icon: Coins, label: "Credit khởi đầu", value: "5 credit" },
              { icon: FileCheck2, label: "Mỗi lần chuẩn bị", value: "1–100 phản hồi" },
              { icon: ShieldCheck, label: "Quyền quyết định", value: "Xác nhận rồi mới gửi" }
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="grid min-h-[66px] grid-cols-[28px_1fr_auto] items-center gap-3 border-b border-inverse-foreground/15 text-[13px]">
                <Icon aria-hidden="true" className="text-accent-soft" size={22} /><span className="text-inverse-muted">{label}</span><strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
        <p className="relative hidden text-[11px] text-inverse-muted min-[921px]:block">Dành cho Google Form công khai mà bạn có quyền vận hành.</p>
      </section>
      <section className="flex min-w-0 flex-col px-5 py-6 min-[921px]:min-h-dvh min-[921px]:px-[clamp(26px,6vw,96px)] min-[921px]:py-[34px]" aria-label={isRegister ? "Đăng ký tài khoản" : "Đăng nhập tài khoản"}>
        <div className="mx-auto my-auto w-full max-w-[480px] py-10 sm:pb-[70px] sm:pt-[55px] min-[921px]:pb-[78px]">{children}</div>
      </section>
    </main>
  );
}

export function AuthHeading({ title, description }: { title: string; description: string }) {
  return <header className="mb-[34px]"><h2 className="text-[35px] font-bold leading-[1.08] tracking-[-.03em] sm:text-[clamp(36px,3.6vw,52px)]">{title}</h2><p className="mt-3 text-sm leading-6 text-secondary-foreground">{description}</p></header>;
}

export function AuthSwitch({ mode }: { mode: "login" | "register" }) {
  return <div className="mt-5"><div className="flex items-center gap-3 text-[11px] text-secondary-foreground"><span className="h-px flex-1 bg-border" />hoặc<span className="h-px flex-1 bg-border" /></div><p className="mt-4 text-center text-xs font-semibold text-secondary-foreground">{mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}</p><Link className="mt-2 flex min-h-[54px] items-center justify-center rounded-xl border border-border-strong bg-surface text-sm font-bold text-primary transition hover:border-primary hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Tạo tài khoản" : "Đăng nhập ngay"}</Link></div>;
}
