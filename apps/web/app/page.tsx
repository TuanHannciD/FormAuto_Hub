import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  Coins,
  FileSpreadsheet,
  Gift,
  Link2,
  Menu,
  MessageSquareText,
  Plus,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";
import { siteUrl } from "@/lib/site";

const siteName = "FormAuto Hub";
const title = "FormAuto Hub | Điền Google Form tự động và xử lý số liệu";
const description =
  "Tự động điền Google Form theo cách bạn thiết lập, hỗ trợ xử lý số liệu theo yêu cầu và tặng 5 credit cho tài khoản mới.";

const primaryButtonClass =
  "inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-primary px-[22px] text-sm font-bold leading-none text-inverse-foreground shadow-raised transition hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-overlay focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary [&>svg]:transition-transform hover:[&>svg]:translate-x-0.5";
const sectionHeadingClass =
  "text-balance text-[clamp(2.5rem,4.4vw,4.125rem)] font-[780] leading-[1.08] tracking-[-0.025em] text-foreground";

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
    <div className="relative grid min-h-[520px] place-items-center max-md:-mx-[6%] max-md:-mb-6 max-md:-mt-8 max-md:min-h-[460px] max-md:w-[112%] max-md:scale-[.88]" aria-label="Minh họa luồng điền Google Form tự động">
      <div className="absolute h-[470px] w-[470px] rounded-full bg-gradient-to-br from-primary/15 to-accent/20 max-md:h-[390px] max-md:w-[390px]" />
      <div className="absolute h-[414px] w-[414px] rounded-full border border-dashed border-primary/25 max-md:h-[342px] max-md:w-[342px]" />
      <div className="absolute h-[530px] w-[530px] rounded-full border border-dashed border-primary/25 max-md:h-[450px] max-md:w-[450px]" />

      <div className="relative z-[2] min-h-[430px] w-[360px] -rotate-2 overflow-hidden rounded-2xl bg-surface p-7 shadow-overlay max-md:min-h-[390px] max-md:w-[300px] max-md:p-[22px]">
        <div className="mb-5 flex items-center gap-2 text-[11px] font-bold text-primary"><span className="h-[19px] w-[15px] rounded-sm bg-primary" />Google Forms</div>
        <h3 className="mb-1 text-[21px] font-bold tracking-tight">Khảo sát trải nghiệm</h3>
        <p className="mb-[22px] text-[10px] text-muted-foreground">Minh họa cấu trúc câu hỏi</p>
        <div className="mt-3 rounded-xl bg-surface-subtle p-[17px] text-[10px] text-secondary-foreground">
          <span className="mb-3 block text-[11px] font-bold text-foreground">Bạn đánh giá trải nghiệm thế nào?</span>
          <div className="mt-2 flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full border-[3px] border-primary" />Rất hài lòng</div>
          <div className="mt-2 flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full border border-border-strong" />Hài lòng</div>
          <div className="mt-2 flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full border border-border-strong" />Bình thường</div>
        </div>
        <div className="mt-3 rounded-xl bg-surface-subtle p-[17px] text-[10px]">
          <span className="mb-3 block text-[11px] font-bold">Chia sẻ thêm ý kiến</span>
          <div className="rounded-lg bg-surface px-2.5 py-2 text-secondary-foreground">Câu trả lời được chuẩn bị theo chỉ dẫn…</div>
        </div>
      </div>

      <div className="motion-float absolute left-0 top-[62px] z-[3] flex min-w-[155px] items-center gap-2.5 rounded-[13px] bg-surface px-[15px] py-[13px] shadow-raised [animation-duration:4s] max-md:-left-1 max-md:top-[70px]">
        <Coins className="h-7 w-7 rounded-lg bg-warning-surface p-1.5 text-warning" /><span className="flex flex-col text-[9px] leading-snug text-muted-foreground"><strong className="text-[13px] text-foreground">5 credit</strong>Dùng thử miễn phí</span>
      </div>
      <div className="motion-float absolute -right-4 top-[135px] z-[3] flex min-w-[155px] items-center gap-2.5 rounded-[13px] bg-surface px-[15px] py-[13px] shadow-raised [animation-delay:.5s] [animation-direction:alternate-reverse] [animation-duration:4.6s] max-md:-right-2 max-md:top-[150px]">
        <Sparkles className="h-7 w-7 rounded-lg bg-primary-soft p-1.5 text-primary" /><span className="flex flex-col text-[9px] leading-snug text-muted-foreground"><strong className="text-[13px] text-foreground">1–100</strong>Phản hồi mỗi lần</span>
      </div>
      <div className="absolute bottom-[38px] right-1 z-[3] flex items-center gap-2.5 rounded-[13px] bg-surface px-[18px] py-[15px] shadow-raised max-md:bottom-5 max-md:right-0">
        <CircleCheck className="h-[30px] w-[30px] text-success" /><span className="flex flex-col text-[9px] leading-snug text-muted-foreground"><strong className="text-[13px] text-foreground">Sẵn sàng xem lại</strong>Chỉ gửi sau khi bạn xác nhận</span>
      </div>
    </div>
  );
}

function MobileNavigation() {
  return (
    <details className="group relative ml-auto md:hidden">
      <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-lg hover:bg-surface-subtle [&::-webkit-details-marker]:hidden">
        <Menu className="group-open:hidden" aria-hidden="true" />
        <X className="hidden group-open:block" aria-hidden="true" />
        <span className="sr-only">Mở menu</span>
      </summary>
      <nav className="absolute right-[-20px] top-[55px] flex w-screen flex-col gap-5 border-b border-border bg-surface px-5 py-6 text-[13px] font-semibold text-secondary-foreground shadow-lg" aria-label="Điều hướng mobile">
        <Link href="#top">Trang chủ</Link><Link href="#dich-vu">Dịch vụ</Link><Link href="#cach-hoat-dong">Cách hoạt động</Link><Link href="#bang-gia">Bảng giá</Link><Link href="/google-forms/sample-data">Hướng dẫn</Link><Link href="#faq">FAQ</Link>
      </nav>
    </details>
  );
}

export default function LandingPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteName,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    url: `${siteUrl}/`,
    inLanguage: "vi-VN",
    description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "VND" },
    featureList: ["Phân tích Google Forms", "Cấu hình quy tắc trả lời", "Xem trước phản hồi trước khi gửi", "Theo dõi credit và nhật ký sử dụng"]
  };

  return (
    <main className="app-aura-bg min-h-screen overflow-x-clip text-foreground" id="top">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <header className="sticky top-0 z-20 grid min-h-[76px] grid-cols-[1fr_auto_1fr] items-center border-b border-border/75 bg-surface/[.88] px-[clamp(1.5rem,5vw,4.75rem)] backdrop-blur-xl max-xl:grid-cols-[1fr_auto] max-md:min-h-[66px] max-md:px-5">
        <Link href="#top" aria-label="FormAuto Hub - Trang chủ"><Brand /></Link>
        <nav className="flex items-center gap-[30px] text-[13px] font-semibold text-secondary-foreground max-xl:hidden" aria-label="Điều hướng chính">
          <Link className="transition hover:text-primary" href="#top">Trang chủ</Link><Link className="transition hover:text-primary" href="#dich-vu">Dịch vụ</Link><Link className="transition hover:text-primary" href="#cach-hoat-dong">Cách hoạt động</Link><Link className="transition hover:text-primary" href="#bang-gia">Bảng giá</Link><Link className="transition hover:text-primary" href="/google-forms/sample-data">Hướng dẫn</Link><Link className="transition hover:text-primary" href="#faq">FAQ</Link>
        </nav>
        <div className="flex items-center justify-end gap-[22px] text-[13px] font-semibold max-md:hidden">
          <Link className="transition hover:text-primary" href="/login">Đăng nhập</Link>
          <Link className={`${primaryButtonClass} min-h-[42px] rounded-[10px] px-[17px] text-xs`} href="/register">Dùng thử miễn phí <ArrowRight aria-hidden="true" /></Link>
        </div>
        <MobileNavigation />
      </header>

      <section className="relative grid min-h-[710px] grid-cols-[minmax(0,1fr)_minmax(470px,.9fr)] items-center gap-[clamp(3rem,7vw,7.5rem)] overflow-hidden bg-surface/15 px-[clamp(1.5rem,6vw,5.75rem)] py-[clamp(4.375rem,8vw,7.375rem)] max-xl:grid-cols-1 max-md:min-h-0 max-md:gap-10 max-md:px-5 max-md:pb-11 max-md:pt-16">
        <div className="absolute -bottom-[135px] -left-[110px] h-[250px] w-[250px] rounded-full border-[44px] border-primary/[.07]" aria-hidden="true" />
        <div className="relative z-[2] max-xl:mx-auto max-xl:max-w-[820px] max-xl:text-center max-md:text-left">
          <Link className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-primary-border bg-surface/75 px-3 py-2 text-xs font-bold text-primary-hover" href="#bang-gia"><Sparkles className="text-warning" aria-hidden="true" /> Tài khoản mới được tặng 5 credit <ChevronRight aria-hidden="true" /></Link>
          <h1 className="mb-6 max-w-[770px] text-balance text-[clamp(3.25rem,5.2vw,5rem)] font-extrabold leading-[1.04] tracking-[-0.025em] max-md:text-[clamp(2.625rem,11.5vw,3.375rem)]">Công cụ điền Google Form tự động <span className="block text-primary">theo cách bạn thiết lập</span></h1>
          <p className="mb-8 max-w-[690px] text-[clamp(1.0625rem,1.35vw,1.25rem)] text-secondary-foreground max-xl:mx-auto max-md:mx-0 max-md:text-base">Dán link form, chọn số lượng và định hướng câu trả lời. FormAuto Hub chuẩn bị phản hồi để bạn xem lại trước khi xác nhận gửi.</p>
          <div className="flex items-center gap-6 max-xl:justify-center max-md:flex-col max-md:items-start">
            <Link className={`${primaryButtonClass} min-h-[58px] px-[27px]`} href="/register">Nhận 5 credit miễn phí <ArrowRight aria-hidden="true" /></Link>
            <Link className="border-b border-foreground pb-1 text-sm font-bold" href="#bang-gia">Xem bảng giá</Link>
          </div>
          <div className="mt-5 flex gap-5 text-xs font-semibold text-secondary-foreground max-xl:justify-center max-md:flex-col max-md:gap-2">
            <span className="flex items-center gap-1.5"><Check className="text-primary" /> Bắt đầu bằng chính form của bạn</span><span className="flex items-center gap-1.5"><Check className="text-primary" /> Bạn luôn là người quyết định</span>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[680px]"><ProductIllustration /></div>
      </section>

      <section className="grid min-h-28 grid-cols-3 border-y border-border bg-surface/[.86] px-[clamp(1.5rem,6vw,5.75rem)] backdrop-blur-xl max-md:grid-cols-1 max-md:px-5 max-md:py-4" aria-label="Ưu điểm chính">
        {[
          { icon: Link2, title: "Dán link và bắt đầu", text: "Hệ thống tự đọc câu hỏi" },
          { icon: MessageSquareText, title: "Chủ động nội dung", text: "Đặt quy tắc hoặc dùng AI" },
          { icon: ShieldCheck, title: "Bạn quyết định", text: "Xác nhận rồi mới gửi" }
        ].map((item, index) => (
          <div className={`flex items-center gap-4 px-[clamp(1.125rem,3vw,2.875rem)] py-6 max-md:border-b max-md:border-border max-md:px-0 max-md:py-4 ${index === 0 ? "pl-0" : ""} ${index < 2 ? "border-r border-border max-md:border-r-0" : "pr-0 max-md:border-b-0"}`} key={item.title}>
            <item.icon className="h-8 w-8 shrink-0 text-primary" /><span className="flex flex-col text-[11px] leading-normal text-muted-foreground"><strong className="text-[13px] text-foreground">{item.title}</strong>{item.text}</span>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-[.92fr_1.08fr] items-center gap-[clamp(4.375rem,10vw,10.625rem)] bg-surface/40 px-[clamp(1.5rem,6vw,5.75rem)] py-[clamp(6.25rem,10vw,9.375rem)] max-xl:grid-cols-1 max-xl:gap-14 max-md:px-5 max-md:py-[88px]" id="loi-ich">
        <div><h2 className={`${sectionHeadingClass} mb-6`}>Bớt thao tác lặp lại.<br />Vẫn kiểm soát từng lần tạo.</h2><p className="max-w-[590px] text-[17px] text-secondary-foreground">FormAuto Hub tập trung vào một việc: giúp bạn chuẩn bị nhiều phản hồi Google Form theo định hướng rõ ràng, nhanh hơn cách nhập thủ công.</p></div>
        <div className="border-t border-border">
          {[
            { icon: Sparkles, title: "Thiết lập theo mục tiêu của bạn", text: "Đặt quy tắc cho lựa chọn hoặc mô tả cách AI nên trả lời, kể cả câu hỏi tự luận." },
            { icon: CircleCheck, title: "Xem kết quả trước khi gửi", text: "Phản hồi được chuẩn bị để bạn kiểm tra. Hệ thống chỉ gửi sau bước xác nhận." },
            { icon: Coins, title: "Biết chi phí trước khi tiếp tục", text: "Mức credit của cách tạo bạn chọn được hiển thị trực tiếp trong sản phẩm." }
          ].map((item) => <article className="grid grid-cols-[auto_1fr] gap-5 border-b border-border py-7" key={item.title}><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><item.icon /></span><div><h3 className="mb-2 text-[19px] font-bold">{item.title}</h3><p className="m-0 max-w-[58ch] text-sm text-secondary-foreground">{item.text}</p></div></article>)}
        </div>
      </section>

      <section className="bg-foreground px-[clamp(1.5rem,6vw,5.75rem)] py-[clamp(6.25rem,10vw,9.375rem)] text-inverse-foreground max-md:px-5 max-md:py-[88px]" id="dich-vu">
        <div className="mb-16 max-w-[760px]"><span className="mb-4 block text-[11px] font-extrabold uppercase tracking-[.11em] text-accent-highlight">Dịch vụ dành cho bạn</span><h2 className={`${sectionHeadingClass} mb-5 text-inverse-foreground`}>Từ lúc cần phản hồi<br />đến khi cần đọc số liệu.</h2><p className="max-w-[620px] text-[17px] text-inverse-muted">Chọn tự thao tác với công cụ hoặc gửi yêu cầu để được hỗ trợ ở phần việc phù hợp.</p></div>
        <div className="grid grid-cols-[1.15fr_.925fr_.925fr] gap-[18px] max-xl:grid-cols-2 max-md:grid-cols-1">
          <ServiceCard icon={FileSpreadsheet} number="01" title="Dịch vụ điền form" primary><p>Dán link Google Form, đặt cách trả lời và số lượng. Hệ thống chuẩn bị phản hồi để bạn xem lại trước khi xác nhận.</p><ul><li><Check /> Tự thao tác trực tiếp</li><li><Check /> Quy tắc hoặc AI hỗ trợ</li><li><Check /> Tính phí theo credit</li></ul><Link className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-inverse-foreground" href="/register">Thử điền form <ArrowRight /></Link></ServiceCard>
          <ServiceCard icon={BarChart3} number="02" title="Xử lý số liệu"><p>Dành cho nhu cầu làm sạch, tổng hợp hoặc phân tích dữ liệu theo đầu bài riêng. Phạm vi và báo giá được trao đổi trước khi thực hiện.</p><span className="mt-auto w-max rounded-full bg-accent/10 px-3 py-2 text-[11px] font-bold text-accent-soft">Dịch vụ theo yêu cầu</span></ServiceCard>
          <ServiceCard icon={Gift} number="03" title="Ưu đãi dễ bắt đầu"><p>Tài khoản mới có 5 credit để thử bằng form của mình. Khi cần nhiều hơn, bạn chọn gói credit phù hợp ngay bên dưới.</p><Link className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-accent-soft" href="#bang-gia">Xem gói credit <ArrowRight /></Link></ServiceCard>
        </div>
      </section>

      <section className="bg-background/80 backdrop-blur-xl" id="cach-hoat-dong"><div className="px-[clamp(1.5rem,6vw,5.75rem)] py-[clamp(4.5rem,7vw,6rem)] max-md:px-5 max-md:py-[88px]"><div className="mx-auto mb-12 max-w-[830px] text-center max-md:text-left"><h2 className={`${sectionHeadingClass} mb-5`}>Bạn chỉ cần làm ba việc</h2><p className="text-[17px] text-secondary-foreground">Nói điều bạn cần, phần nhập liệu lặp lại để FormAuto Hub lo.</p></div><div className="relative grid grid-cols-3 gap-5 max-md:grid-cols-1 max-md:gap-8"><div className="absolute left-[15%] right-[15%] top-7 h-px bg-primary-border max-md:bottom-9 max-md:left-7 max-md:right-auto max-md:h-auto max-md:w-px" />{[
        ["1", "Đưa form của bạn vào", "Dán link Google Form công khai. Các câu hỏi và lựa chọn sẽ được đọc tự động."],
        ["2", "Nói bạn muốn câu trả lời thế nào", "Chọn số lượng từ 1–100, rồi đặt quy tắc hoặc mô tả hướng trả lời mong muốn."],
        ["3", "Xem lại, ưng rồi mới gửi", "Bạn xem những gì đã được chuẩn bị và chỉ xác nhận khi cảm thấy phù hợp."]
      ].map(([number, heading, text]) => <article className="relative px-6 text-center max-md:min-h-[110px] max-md:pl-[84px] max-md:pr-0 max-md:text-left" key={number}><span className="relative z-[1] mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full border-[7px] border-background bg-primary font-extrabold text-inverse-foreground max-md:absolute max-md:left-0 max-md:top-0">{number}</span><h3 className="mb-2.5 text-xl font-bold">{heading}</h3><p className="mx-auto max-w-[36ch] text-[13px] text-secondary-foreground max-md:mx-0">{text}</p></article>)}</div></div></section>

      <section className="bg-background/70 px-[clamp(1.5rem,6vw,5.75rem)] py-[clamp(6.25rem,10vw,9.375rem)] backdrop-blur-xl max-md:px-5 max-md:py-[88px]" id="bang-gia">
        <div className="mb-16 max-w-[820px]"><span className="mb-4 block text-[11px] font-extrabold uppercase tracking-[.11em] text-primary">Bảng giá credit</span><h2 className={`${sectionHeadingClass} mb-5`}>Thử miễn phí.<br />Cần thêm thì nạp đúng gói.</h2><p className="max-w-[690px] text-[17px] text-secondary-foreground">Một credit có giá tương đương 20₫ theo các gói đang hiển thị trong khu vực nạp. Credit không phải gói thuê bao tháng.</p></div>
        <div className="grid grid-cols-3 items-stretch gap-[18px] max-md:grid-cols-1">
          <PlanCard label="Dùng thử" credits="5 credit" price="0₫" text="Dành cho tài khoản mới để thử luồng với form của bạn." items={["Khoảng 5 lượt theo quy tắc", "Không cần mua gói trước"]} href="/register" action="Nhận 5 credit" trial />
          <PlanCard label="Gói 100" badge="Dễ bắt đầu" credits="100 credit" price="2.000₫" text="Tương đương 20₫ cho mỗi credit." items={["100 lượt theo quy tắc", "50 lượt AI hỗ trợ", "Khoảng 33 lượt AI chỉ dẫn riêng"]} href="/login" action="Đăng nhập để nạp" featured />
          <PlanCard label="Gói 500" credits="500 credit" price="10.000₫" text="Tương đương 20₫ cho mỗi credit." items={["500 lượt theo quy tắc", "250 lượt AI hỗ trợ", "Khoảng 166 lượt AI chỉ dẫn riêng"]} href="/login" action="Đăng nhập để nạp" />
        </div>
        <div className="mt-7 grid grid-cols-3 overflow-hidden rounded-[14px] border border-border bg-surface max-md:grid-cols-1">{[["Theo quy tắc", "1 credit ≈ 20₫/lượt"], ["AI hỗ trợ", "2 credit ≈ 40₫/lượt"], ["AI chỉ dẫn riêng", "3 credit ≈ 60₫/lượt"]].map(([label, value], index) => <div className={`flex min-h-[92px] flex-col justify-center px-6 py-5 ${index < 2 ? "border-r border-border max-md:border-b max-md:border-r-0" : ""}`} key={label}><span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span><strong className="text-[15px]">{value}</strong></div>)}</div>
        <p className="mt-4 max-w-[920px] text-[11px] text-muted-foreground">Số lượt là mức quy đổi tối đa theo hệ số credit; lượt AI 3× được làm tròn xuống.</p>
      </section>

      <section className="grid min-h-[650px] grid-cols-2 bg-foreground text-inverse-foreground max-md:grid-cols-1">
        <div className="brand-radial-bg relative grid min-h-[520px] place-items-center overflow-hidden max-md:min-h-[460px]"><div className="absolute h-[440px] w-[440px] rounded-full border border-inverse-foreground/10" /><div className="absolute h-[300px] w-[300px] rounded-full border border-inverse-foreground/10" /><div className="relative z-[2] grid h-[132px] w-[132px] place-items-center rounded-full bg-primary shadow-overlay"><ShieldCheck className="h-[58px] w-[58px]" /></div><ControlTag className="left-[16%] top-[25%]" icon={Clock3}>Xem trước</ControlTag><ControlTag className="right-[13%] top-[44%]" icon={Check}>Xác nhận</ControlTag><ControlTag className="bottom-[20%] left-[24%]" icon={ArrowRight}>Gửi theo nhóm</ControlTag></div>
        <div className="flex flex-col justify-center px-[clamp(2.125rem,7vw,6.875rem)] py-[clamp(5rem,9vw,8.75rem)] max-md:px-5 max-md:py-[75px]"><h2 className={`${sectionHeadingClass} mb-7 max-w-[760px] text-inverse-foreground`}>Tự động hóa không đồng nghĩa với mất kiểm soát.</h2><p className="mb-7 max-w-[620px] text-[17px] text-inverse-muted">Bạn chủ động từ đầu vào đến bước xác nhận cuối. Phản hồi chỉ được gửi khi bạn đã xem lại và đồng ý tiếp tục.</p><Link className="inline-flex w-max items-center gap-2 text-sm font-bold text-accent-soft" href="/register">Trải nghiệm với form của bạn <ArrowRight /></Link></div>
      </section>

      <section className="grid grid-cols-[.8fr_1.2fr] gap-[clamp(3.75rem,10vw,10rem)] bg-surface/45 px-[clamp(1.5rem,6vw,5.75rem)] py-[clamp(6.25rem,10vw,9.375rem)] max-md:grid-cols-1 max-md:gap-10 max-md:px-5 max-md:py-[88px]" id="faq">
        <div><h2 className={`${sectionHeadingClass} mb-5 text-[clamp(2.5rem,4vw,3.625rem)]`}>Câu hỏi thường gặp</h2><p className="text-secondary-foreground">Những điều quan trọng trước khi bạn bắt đầu.</p></div>
        <div className="border-t border-border-strong">{[
          ["Form nào có thể sử dụng?", "Hiện tại, sản phẩm làm việc với URL Google Form được đặt ở chế độ công khai."],
          ["Tôi có được xem lại trước khi gửi không?", "Có. Kết quả được chuẩn bị để bạn kiểm tra và cần xác nhận trước khi hệ thống tiến hành gửi."],
          ["Mỗi lần có thể tạo bao nhiêu phản hồi?", "Bạn có thể chọn từ 1 đến 100 phản hồi trong một lần tạo."],
          ["Credit được tính như thế nào?", "Theo quy tắc dùng 1 credit/lượt; AI hỗ trợ dùng 2 credit/lượt; AI theo chỉ dẫn riêng dùng 3 credit/lượt."],
          ["Dịch vụ xử lý số liệu gồm những gì?", "Đây là dịch vụ theo yêu cầu. Phạm vi làm sạch, tổng hợp hoặc phân tích dữ liệu và báo giá cần được thống nhất trước khi bắt đầu."]
        ].map(([question, answer]) => <details className="group border-b border-border" key={question}><summary className="flex min-h-[82px] cursor-pointer list-none items-center justify-between gap-5 text-base font-bold group-open:text-primary [&::-webkit-details-marker]:hidden">{question}<Plus className="shrink-0 transition-transform group-open:rotate-45" /></summary><p className="-mt-1 mb-6 mr-12 max-w-[65ch] text-sm text-secondary-foreground">{answer}</p></details>)}</div>
      </section>

      <section className="relative mx-[clamp(1.5rem,5vw,4.75rem)] flex items-center justify-between gap-12 overflow-hidden rounded-2xl bg-gradient-to-r from-primary-hover via-primary to-accent px-[clamp(1.75rem,6vw,5.5rem)] py-[clamp(3.5rem,6vw,5.375rem)] text-inverse-foreground max-md:mx-5 max-md:flex-col max-md:items-start max-md:px-6 max-md:py-14"><div className="absolute -bottom-[185px] right-1/4 h-[260px] w-[260px] rounded-full border-[38px] border-inverse-foreground/10" /><div><h2 className={`${sectionHeadingClass} mb-2.5 text-[clamp(2.375rem,4.3vw,3.875rem)] text-inverse-foreground`}>Bắt đầu với 5 credit miễn phí</h2><p className="m-0 text-primary-soft">Dùng thử toàn bộ luồng bằng một form công khai của bạn.</p></div><Link className="relative z-[2] inline-flex min-h-[58px] shrink-0 items-center justify-center gap-2.5 rounded-xl bg-surface px-[27px] text-sm font-bold text-primary-hover shadow-raised transition hover:-translate-y-0.5" href="/register">Tạo tài khoản ngay <ArrowRight /></Link></section>

      <footer className="grid min-h-[150px] grid-cols-[1fr_auto_1fr] items-center gap-8 bg-surface/50 px-[clamp(1.5rem,5vw,4.75rem)] py-10 max-md:grid-cols-1 max-md:justify-items-start max-md:px-5"><Brand /><p className="m-0 text-center text-[11px] text-muted-foreground max-md:text-left">Công cụ điền Google Form tự động theo cách bạn thiết lập.</p><div className="flex justify-end gap-6 text-xs font-semibold text-secondary-foreground max-md:flex-wrap max-md:justify-start"><Link className="hover:text-primary" href="#dich-vu">Dịch vụ</Link><Link className="hover:text-primary" href="#bang-gia">Bảng giá</Link><Link className="hover:text-primary" href="/login">Đăng nhập</Link><Link className="hover:text-primary" href="#faq">FAQ</Link></div></footer>
    </main>
  );
}

function ServiceCard({ icon: Icon, number, title, primary = false, children }: { icon: typeof Sparkles; number: string; title: string; primary?: boolean; children: React.ReactNode }) {
  return <article className={`relative flex min-h-[440px] flex-col rounded-2xl border p-[34px] max-md:min-h-[390px] max-md:p-7 ${primary ? "border-transparent bg-gradient-to-br from-primary to-primary-hover max-xl:col-span-2 max-md:col-span-1" : "border-inverse-foreground/15 bg-surface/[.055]"}`}><span className={`mb-14 grid h-[52px] w-[52px] place-items-center rounded-[14px] ${primary ? "bg-surface text-primary-hover" : "bg-surface/10 text-accent-soft"}`}><Icon className="h-6 w-6" /></span><span className="absolute right-[34px] top-[35px] text-[11px] font-extrabold tracking-[.1em] text-muted-foreground">{number}</span><h3 className="mb-3.5 text-[26px] font-bold text-inverse-foreground">{title}</h3><div className="contents [&>p]:mb-5 [&>p]:text-sm [&>p]:text-inverse-muted [&>ul]:mb-6 [&>ul]:space-y-2.5 [&>ul]:text-xs [&>ul]:text-inverse-muted [&_li]:flex [&_li]:items-center [&_li]:gap-2">{children}</div></article>;
}

function PlanCard({ label, badge, credits, price, text, items, href, action, trial = false, featured = false }: { label: string; badge?: string; credits: string; price: string; text: string; items: string[]; href: string; action: string; trial?: boolean; featured?: boolean }) {
  return <article className={`flex min-h-[510px] flex-col rounded-2xl p-8 shadow-raised max-md:min-h-[485px] max-md:p-7 ${trial ? "border border-transparent bg-gradient-to-br from-primary-hover to-primary text-inverse-foreground" : featured ? "border-2 border-primary bg-surface shadow-overlay" : "border border-border bg-surface"}`}><div className={`flex min-h-[30px] items-center justify-between gap-3 text-[11px] font-extrabold uppercase tracking-[.08em] ${trial ? "text-primary-border" : "text-muted-foreground"}`}><span>{label}</span>{badge ? <span className="rounded-full bg-primary-soft px-2.5 py-1.5 text-[9px] text-primary-hover">{badge}</span> : trial ? <Gift className="h-5 w-5" /> : <Coins className="h-5 w-5" />}</div><h3 className={`mb-1 mt-8 text-[26px] font-bold ${trial ? "text-inverse-foreground" : "text-foreground"}`}>{credits}</h3><div className={`mb-4 text-[clamp(2.5rem,4vw,3.625rem)] font-[820] leading-none tracking-[-.05em] ${trial ? "text-inverse-foreground" : "text-foreground"}`}>{price}</div><p className={`mb-5 min-h-[52px] text-[13px] ${trial ? "text-primary-soft" : "text-secondary-foreground"}`}>{text}</p><ul className={`mb-6 space-y-2.5 text-xs ${trial ? "text-primary-soft" : "text-secondary-foreground"}`}>{items.map((item) => <li className="flex items-center gap-2" key={item}><Check className={`shrink-0 ${trial ? "text-accent-soft" : "text-primary"}`} />{item}</li>)}</ul><Link className={`mt-auto inline-flex min-h-[52px] items-center justify-center rounded-xl px-5 text-sm font-bold transition hover:-translate-y-0.5 ${trial ? "bg-surface text-primary-hover shadow-lg" : featured ? "bg-primary text-inverse-foreground shadow-lg" : "border border-primary-border bg-surface text-primary-hover"}`} href={href}>{action}</Link></article>;
}

function ControlTag({ icon: Icon, className, children }: { icon: typeof Check; className: string; children: React.ReactNode }) {
  return <span className={`absolute z-[3] flex items-center gap-2 rounded-full bg-surface px-3.5 py-2.5 text-[11px] font-bold text-foreground shadow-overlay ${className}`}><Icon />{children}</span>;
}
