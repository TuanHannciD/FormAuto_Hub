import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Coins,
  FileSpreadsheet,
  Gift,
  Plus,
  Sparkles
} from "lucide-react";
import { MobileNavigation } from "@/components/mobile-navigation";
import { siteUrl } from "@/lib/site";
import { applicationSchema, serializeJsonLd, siteName, websiteSchema } from "@/lib/seo";

const title = "FormAuto Hub | Điền Google Form tự động và xử lý số liệu";
const description =
  "Tự động điền Google Form theo cách bạn thiết lập, hỗ trợ xử lý số liệu theo yêu cầu và tặng 5 credit cho tài khoản mới.";

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2.5 rounded-xl bg-primary px-[22px] text-sm font-bold leading-none text-inverse-foreground shadow-soft transition hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-raised focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary motion-reduce:transform-none [&>svg]:transition-transform hover:[&>svg]:translate-x-0.5";
const sectionHeadingClass =
  "text-balance text-[clamp(1.5rem,2.5vw,2rem)] font-[780] leading-[1.12] tracking-[-0.025em] text-foreground";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["FormAuto Hub", "Google Forms", "điền Google Form tự động", "tạo dữ liệu mẫu Google Forms", "xử lý số liệu"],
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName,
    locale: "vi_VN",
    type: "website",
    images: [{ url: "/images/landing/login-screen.png", width: 1440, height: 1000, alt: "FormAuto Hub" }]
  },
  twitter: { card: "summary_large_image", title, description, images: ["/images/landing/login-screen.png"] }
};

function Brand() {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="grid h-[34px] w-[34px] grid-cols-3 items-end gap-0.5 rounded-[10px] bg-primary p-[7px] shadow-raised" aria-hidden="true">
        <i className="h-[42%] rounded-t-sm bg-surface/75" />
        <i className="h-[68%] rounded-t-sm bg-surface/90" />
        <i className="h-full rounded-t-sm bg-surface" />
      </span>
      <strong className="text-[15px] font-extrabold tracking-[-0.02em]">FormAuto Hub</strong>
    </span>
  );
}

function ProductIllustration() {
  return (
    <div className="relative grid min-h-[320px] place-items-center max-lg:min-h-[220px]" aria-label="Minh họa luồng điền Google Form tự động">
      <div className="absolute h-[280px] w-[280px] rounded-full bg-gradient-to-br from-primary/15 to-accent/20 max-lg:h-[200px] max-lg:w-[200px]" aria-hidden="true" />
      <div className="relative w-[280px] -rotate-2 rounded-2xl bg-surface p-5 shadow-floating max-lg:w-[260px] max-lg:p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold text-primary"><FileSpreadsheet className="h-4 w-4" aria-hidden="true" />Google Forms</div>
        <h3 className="mb-1 text-lg font-bold tracking-tight">Khảo sát trải nghiệm</h3>
        <p className="mb-3 text-xs text-muted-foreground">Minh họa câu hỏi và lựa chọn</p>
        <div className="rounded-xl bg-surface-subtle p-3 text-xs text-secondary-foreground">
          <span className="mb-2 block font-semibold text-foreground">Bạn đánh giá trải nghiệm thế nào?</span>
          {["Rất hài lòng", "Hài lòng", "Bình thường"].map((answer, index) => (
            <div className="mt-2 flex items-center gap-2" key={answer}><i className={`h-2.5 w-2.5 rounded-full border ${index === 0 ? "border-[3px] border-primary" : "border-border-strong"}`} />{answer}</div>
          ))}
        </div>
        <div className="mt-3 rounded-xl bg-surface-subtle p-3 text-xs max-lg:hidden">
          <span className="mb-2 block font-semibold">Chia sẻ thêm ý kiến</span>
          <p className="text-secondary-foreground">Câu trả lời theo chỉ dẫn của bạn…</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [websiteSchema(), applicationSchema()]
  };
  const sectionClass = "scroll-mt-20 px-[clamp(1.25rem,6vw,5.75rem)] py-10 max-md:py-7";

  return (
    <main className="app-aura-bg landing-page min-h-screen overflow-x-clip text-foreground" id="top">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />
      <header className="sticky top-0 z-20 grid min-h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-border/75 bg-surface/[.88] px-[clamp(1.25rem,5vw,4.75rem)] backdrop-blur-xl max-xl:grid-cols-[1fr_auto] max-md:px-5">
        <Link className="inline-flex min-h-11 items-center justify-self-start" href="#top" aria-label="FormAuto Hub - Trang chủ"><Brand /></Link>
        <nav className="flex items-center gap-5 text-[13px] font-semibold text-secondary-foreground max-xl:hidden [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center" aria-label="Điều hướng chính">
          <Link className="hover:text-primary" href="#top">Trang chủ</Link><Link className="hover:text-primary" href="#dich-vu">Dịch vụ</Link><Link className="hover:text-primary" href="#cach-hoat-dong">Cách hoạt động</Link><Link className="hover:text-primary" href="#bang-gia">Bảng giá</Link><Link className="hover:text-primary" href="/google-forms/sample-data">Hướng dẫn</Link><Link className="hover:text-primary" href="#faq">FAQ</Link>
        </nav>
        <div className="flex items-center justify-end gap-5 text-[13px] font-semibold max-md:hidden">
          <Link className="inline-flex min-h-11 items-center hover:text-primary" href="/login">Đăng nhập</Link>
          <Link className={`${primaryButtonClass} rounded-[10px] px-4 text-xs`} href="/register">Dùng thử miễn phí <ArrowRight aria-hidden="true" /></Link>
        </div>
        <MobileNavigation />
      </header>

      <section className="grid grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)] items-center gap-8 px-[clamp(1.25rem,6vw,5.75rem)] py-8 max-lg:grid-cols-1 max-lg:gap-5 max-md:py-6">
        <div>
          <h1 className="mb-4 max-w-[25ch] text-balance text-[clamp(2rem,3.3vw,2.75rem)] font-extrabold leading-[1.15] tracking-[-0.025em] max-md:text-[1.875rem]">Điền Google Form tự động <span className="text-primary">theo cách bạn thiết lập</span></h1>
          <p className="mb-5 max-w-[60ch] text-base leading-6 text-secondary-foreground">Dán link, chọn 1–100 phản hồi và đặt quy tắc hoặc dùng AI.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link className={primaryButtonClass} href="/register">Nhận 5 credit miễn phí <ArrowRight aria-hidden="true" /></Link>
            <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4" href="#bang-gia">Xem bảng giá</Link>
          </div>
          <p className="mt-3 max-w-[60ch] text-sm leading-5 text-secondary-foreground">Theo quy tắc: tạo và gửi ngay. Với AI: xem trước rồi xác nhận gửi.</p>
        </div>
        <ProductIllustration />
      </section>

      <section className={`${sectionClass} border-y border-border bg-surface/60`} id="cach-hoat-dong">
        <h2 className={`${sectionHeadingClass} mb-5`}>Bắt đầu trong 3 bước</h2>
        <ol className="grid grid-cols-3 gap-6 max-md:grid-cols-1 max-md:gap-4">
          {[
            ["Dán link form", "Dùng Google Form công khai mà bạn được phép sử dụng."],
            ["Đặt cách trả lời", "Chọn số lượng, quy tắc hoặc chỉ dẫn cho AI."],
            ["Tạo và gửi", "Quy tắc gửi ngay; AI cần xem trước và xác nhận."]
          ].map(([heading, text], index) => (
            <li className="flex gap-3" key={heading}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary" aria-hidden="true">{index + 1}</span>
              <div><h3 className="mb-1 text-base font-bold">{heading}</h3><p className="max-w-[40ch] text-sm leading-5 text-secondary-foreground">{text}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${sectionClass} bg-foreground text-inverse-foreground`} id="dich-vu">
        <h2 className={`${sectionHeadingClass} mb-5 text-inverse-foreground`}>Điền form và xử lý số liệu</h2>
        <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1 max-md:gap-5">
          <ServiceCard icon={FileSpreadsheet} title="Tự động hóa biểu mẫu">
            <p>Tự thiết lập câu trả lời bằng quy tắc hoặc AI, tính phí theo credit.</p>
            <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-inverse-foreground underline underline-offset-4" href="/register">Thử điền form <ArrowRight aria-hidden="true" /></Link>
          </ServiceCard>
          <ServiceCard icon={BarChart3} title="Xử lý số liệu theo yêu cầu">
            <p>Làm sạch, tổng hợp hoặc phân tích dữ liệu. Thống nhất phạm vi và báo giá trước khi thực hiện.</p>
          </ServiceCard>
        </div>
      </section>

      <section className={`${sectionClass} bg-background/70`} id="bang-gia">
        <div className="mb-5 max-w-[65ch]">
          <h2 className={`${sectionHeadingClass} mb-3`}>Bảng giá credit</h2>
          <p className="text-base leading-6 text-secondary-foreground">Tài khoản mới có 5 credit miễn phí. Nạp thêm từ 2.000₫, tương đương 20₫/credit; không phải thuê bao tháng.</p>
        </div>
        <div className="grid grid-cols-3 items-stretch gap-4 max-md:grid-cols-1">
          <PlanCard label="Dùng thử" credits="5 credit" price="0₫" items={["Khoảng 5 lượt theo quy tắc", "Không cần mua gói trước"]} href="/register" action="Nhận 5 credit" trial />
          <PlanCard label="Gói 100" badge="Dễ bắt đầu" credits="100 credit" price="2.000₫" items={["100 lượt theo quy tắc", "50 lượt AI hỗ trợ", "Khoảng 33 lượt AI chỉ dẫn riêng"]} href="/login" action="Đăng nhập để nạp" featured />
          <PlanCard label="Gói 500" credits="500 credit" price="10.000₫" items={["500 lượt theo quy tắc", "250 lượt AI hỗ trợ", "Khoảng 166 lượt AI chỉ dẫn riêng"]} href="/login" action="Đăng nhập để nạp" />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-secondary-foreground">{[["Theo quy tắc", "1 credit ≈ 20₫/lượt"], ["AI hỗ trợ", "2 credit ≈ 40₫/lượt"], ["AI chỉ dẫn riêng", "3 credit ≈ 60₫/lượt"]].map(([label, value]) => <p key={label}><strong className="font-semibold text-foreground">{label}:</strong> {value}</p>)}</div>
        <p className="mt-3 max-w-[75ch] text-xs leading-5 text-muted-foreground">Số lượt là mức quy đổi tối đa theo hệ số credit; lượt AI 3× được làm tròn xuống.</p>
      </section>

      <section className={`${sectionClass} grid grid-cols-[.8fr_1.2fr] gap-8 bg-surface/45 max-md:grid-cols-1 max-md:gap-4`} id="faq">
        <h2 className={sectionHeadingClass}>Câu hỏi thường gặp</h2>
        <div className="border-t border-border-strong">{[
          ["Form nào có thể sử dụng?", "Google Form công khai mà bạn sở hữu hoặc được phép sử dụng."],
          ["Tôi có được xem lại trước khi gửi không?", "AI cần xem trước và xác nhận trước khi gửi. Với chế độ theo quy tắc, nút Tạo và gửi ngay thực hiện trực tiếp, không có bước xem trước."],
          ["Mỗi lần có thể tạo bao nhiêu phản hồi?", "Bạn có thể chọn từ 1 đến 100 phản hồi trong một lần tạo."],
          ["Credit được tính như thế nào?", "Theo quy tắc dùng 1 credit/lượt; AI hỗ trợ dùng 2 credit/lượt; AI theo chỉ dẫn riêng dùng 3 credit/lượt."],
          ["Dịch vụ xử lý số liệu gồm những gì?", "Làm sạch, tổng hợp hoặc phân tích dữ liệu theo yêu cầu. Phạm vi và báo giá được thống nhất trước khi bắt đầu."]
        ].map(([question, answer]) => (
          <details className="group border-b border-border" key={question}>
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-semibold group-open:text-primary [&::-webkit-details-marker]:hidden">{question}<Plus className="h-5 w-5 shrink-0 transition-transform group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true" /></summary>
            <p className="mb-4 mr-6 max-w-[65ch] text-sm leading-6 text-secondary-foreground">{answer}</p>
          </details>
        ))}</div>
      </section>

      <section className="mx-[clamp(1.25rem,5vw,4.75rem)] flex items-center justify-between gap-5 rounded-2xl bg-primary px-6 py-6 text-inverse-foreground max-md:flex-col max-md:items-start">
        <h2 className="text-xl font-bold">Sẵn sàng thử với form của bạn?</h2>
        <Link className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-surface px-5 text-sm font-bold text-primary-hover" href="/register">Tạo tài khoản ngay <ArrowRight aria-hidden="true" /></Link>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 px-[clamp(1.25rem,5vw,4.75rem)] py-6">
        <Brand />
        <nav className="flex flex-wrap gap-x-5 text-sm font-semibold text-secondary-foreground [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center" aria-label="Liên kết cuối trang"><Link className="hover:text-primary" href="#dich-vu">Dịch vụ</Link><Link className="hover:text-primary" href="#bang-gia">Bảng giá</Link><Link className="hover:text-primary" href="/login">Đăng nhập</Link><Link className="hover:text-primary" href="#faq">FAQ</Link></nav>
      </footer>
    </main>
  );
}

function ServiceCard({ icon: Icon, title, children }: { icon: typeof Sparkles; title: string; children: React.ReactNode }) {
  return (
    <article className="flex items-start gap-3">
      <Icon className="mt-0.5 h-6 w-6 shrink-0 text-accent-soft" aria-hidden="true" />
      <div><h3 className="mb-2 text-lg font-bold">{title}</h3><div className="max-w-[60ch] space-y-2 text-sm leading-6 text-inverse-muted">{children}</div></div>
    </article>
  );
}

function PlanCard({ label, badge, credits, price, items, href, action, trial = false, featured = false }: { label: string; badge?: string; credits: string; price: string; items: string[]; href: string; action: string; trial?: boolean; featured?: boolean }) {
  return (
    <article className={`flex flex-col rounded-2xl border p-5 max-md:p-4 ${trial ? "border-transparent bg-primary text-inverse-foreground" : featured ? "border-primary bg-surface" : "border-border bg-surface"}`}>
      <div className={`mb-3 flex min-h-6 items-center justify-between gap-2 text-xs font-semibold ${trial ? "text-primary-soft" : "text-secondary-foreground"}`}><span>{label}</span>{badge ? <span className="rounded-full bg-primary-soft px-2 py-1 text-primary-hover">{badge}</span> : trial ? <Gift className="h-4 w-4" aria-hidden="true" /> : <Coins className="h-4 w-4" aria-hidden="true" />}</div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><h3 className="text-lg font-bold">{credits}</h3><p className="text-2xl font-bold tracking-tight">{price}</p></div>
      <ul className={`mb-4 space-y-2 text-sm ${trial ? "text-primary-soft" : "text-secondary-foreground"}`}>{items.map(item => <li className="flex items-start gap-2" key={item}><Check className={`mt-0.5 h-4 w-4 shrink-0 ${trial ? "text-primary-soft" : "text-primary"}`} aria-hidden="true" />{item}</li>)}</ul>
      <Link className={`mt-auto inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-bold ${trial ? "bg-surface text-primary-hover" : featured ? "bg-primary text-inverse-foreground" : "border border-primary-border text-primary-hover"}`} href={href}>{action}</Link>
    </article>
  );
}
