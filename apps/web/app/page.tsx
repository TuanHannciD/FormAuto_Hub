import type { Metadata } from "next";
import Link from "next/link";
import { LandingDashboardTabs } from "@/components/landing-dashboard-tabs";
import { ScrollReveal } from "@/components/scroll-reveal";
import { siteUrl } from "@/lib/site";
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileSearch,
  History,
  LinkIcon,
  ListChecks,
  ShieldCheck,
  ReceiptText,
  Search,
  Wallet,
  Eye
} from "lucide-react";
// === FILE MAP (page.tsx – 699 dòng) ===
// Dòng    Section                         Mục đích
// 1-20    Imports                         React, Next.js, lucide, components, lib
// 22-24   SEO constants                   siteName, title, description
// 27-33   workflowSteps                   Các bước workflow hiển thị trên landing
// 35-66   featureCards                    6 thẻ tính năng chính
// 68-94   seoUseCaseLinks                 Internal links cho SEO landing pages
// 96-112  creditCards                     3 thẻ gói credit
// 114-143 faqs                            10 câu hỏi thường gặp
// 145-183 metadata                        Next.js Metadata export (SEO tags)
// 185     LandingPage()                   Trang landing chính: hero, tabs, features, FAQ, CTA
// 533     DashboardPreview()              Mockup dashboard minh họa giao diện
// 617     Metric()                        Component hiển thị số liệu trong mockup
// 626     EmptyPreview()                  Empty state trong mockup
// 635     Footer()                        Footer với copyright + links

const siteName = "FormAuto Hub";
const title = "FormAuto Hub | Dữ liệu mẫu Google Forms cho báo cáo";
const description =
  "Tạo dữ liệu phản hồi mẫu để kiểm tra Google Forms, Google Sheets và biểu đồ báo cáo trước khi thu thập phản hồi thật.";

const workflowSteps = [
  { title: "Thêm URL biểu mẫu", icon: LinkIcon },
  { title: "Nhận diện câu hỏi", icon: FileSearch },
  { title: "Cấu hình quy tắc", icon: ListChecks },
  { title: "Xem trước phản hồi", icon: Eye },
  { title: "Xác nhận gửi", icon: CheckCircle2 }
];

const featureCards = [
  {
    title: "Test form trước khi gửi khảo sát",
    body: "Kiểm tra câu hỏi bắt buộc, lựa chọn, text field và dữ liệu xuất ra trước khi gửi form thật.",
    icon: BarChart3
  },
  {
    title: "Demo dữ liệu cho bài thuyết trình",
    body: "Tạo dữ liệu mẫu để minh họa bảng tính, biểu đồ hoặc dashboard khi dữ liệu thật chưa sẵn sàng.",
    icon: ClipboardList
  },
  {
    title: "Kiểm thử Google Forms to Sheets",
    body: "Rà soát dữ liệu đổ về Google Sheets, biểu đồ và báo cáo trước khi nhóm chạy khảo sát thật.",
    icon: Eye
  },
  {
    title: "Quản lý credit",
    body: "Theo dõi số dư, yêu cầu nạp credit và giao dịch credit.",
    icon: Wallet
  },
  {
    title: "Nhật ký sử dụng",
    body: "Kiểm tra thao tác công cụ, trạng thái và credit đã dùng.",
    icon: History
  },
  {
    title: "Đối soát nạp credit",
    body: "Theo dõi yêu cầu nạp, thanh toán PayOS và trạng thái cộng credit.",
    icon: ShieldCheck
  }
];

const seoUseCaseLinks = [
  {
    href: "/google-forms/sample-data",
    title: "Tạo dữ liệu mẫu cho Google Forms",
    body: "Landing page chính cho nhu cầu kiểm thử biểu mẫu, xem trước phản hồi và demo Google Sheets."
  },
  {
    href: "/google-forms/student-report",
    title: "Dữ liệu mẫu Google Forms cho báo cáo sinh viên",
    body: "Dành cho nhóm học tập cần dữ liệu minh họa, biểu đồ và báo cáo nhưng không thay thế phản hồi thật."
  },
  {
    href: "/google-forms/survey-demo",
    title: "Demo dữ liệu khảo sát Google Forms",
    body: "Chuẩn bị dữ liệu mẫu để trình bày form, bảng tính, dashboard hoặc prototype khảo sát."
  },
  {
    href: "/google-forms/sheets-report",
    title: "Kiểm tra dữ liệu Google Forms trong Google Sheets",
    body: "Rà soát cột, kiểu dữ liệu, chart, dashboard, công thức và pivot table trước khi chạy khảo sát thật."
  },
  {
    href: "/anti-abuse",
    title: "Chính sách chống lạm dụng Google Forms automation",
    body: "Làm rõ ranh giới an toàn: không spam, không captcha bypass, không làm giả khảo sát."
  }
];

const creditCards = [
  {
    title: "Nạp credit",
    body: "Chọn gói credit và thanh toán qua PayOS hoặc gửi yêu cầu đối soát khi cần.",
    icon: CreditCard
  },
  {
    title: "Theo dõi giao dịch",
    body: "Mọi thay đổi credit đều được ghi vào giao dịch credit.",
    icon: ReceiptText
  },
  {
    title: "Rà soát lượt dùng",
    body: "Nhật ký sử dụng hiển thị thao tác, trạng thái và credit đã dùng.",
    icon: Search
  }
];

const faqs = [
  {
    question: "FormAuto Hub có tự động gửi phản hồi không?",
    answer:
      "Không. Hệ thống yêu cầu xem trước và người dùng xác nhận trước khi gửi."
  },
  {
    question: "Có được dùng dữ liệu mẫu để nộp như dữ liệu khảo sát thật không?",
    answer:
      "Không. Dữ liệu mẫu chỉ dùng để kiểm thử, demo hoặc chuẩn bị báo cáo; kết luận học thuật vẫn cần phản hồi thật hợp lệ."
  },
  {
    question: "Có thể tạo bao nhiêu phản hồi mỗi lần?",
    answer: "Mỗi thao tác hỗ trợ từ 1 đến 100 câu trả lời xem trước."
  },
  {
    question: "Có thể nạp credit tự động không?",
    answer:
      "Có. FormAuto Hub hỗ trợ nạp credit tự động qua PayOS. Các phương thức thanh toán khác đang cập nhật."
  },
  {
    question: "Công cụ có vượt captcha hoặc giới hạn của Google không?",
    answer:
      "Không. FormAuto Hub không hỗ trợ vượt captcha, xoay proxy, tạo tài khoản giả hoặc né giới hạn của Google."
  },
  {
    question: "Dashboard theo dõi những gì?",
    answer: "Credit, yêu cầu nạp credit, nhật ký sử dụng, giao dịch credit và dữ liệu hồ sơ/tài khoản."
  }
];

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "FormAuto Hub",
    "Google Forms",
    "google forms báo cáo sinh viên",
    "tạo dữ liệu mẫu cho Google Forms",
    "tạo dữ liệu mẫu Google Forms",
    "demo dữ liệu khảo sát",
    "Google Forms to Sheets báo cáo",
    "kiểm tra Google Form trước khi gửi"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName,
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/images/landing/login-screen.png",
        width: 1440,
        height: 1000,
        alt: "FormAuto Hub web screen"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/images/landing/login-screen.png"]
  }
};

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
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "VND"
    },
    featureList: [
      "Phân tích Google Forms",
      "Cấu hình quy tắc trả lời",
      "Xem trước phản hồi trước khi gửi",
      "Theo dõi credit và usage logs"
    ],
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    inLanguage: "vi-VN"
  };

  return (
    <main className="app-aura-bg min-h-screen overflow-x-hidden text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([structuredData, websiteStructuredData]) }}
      />

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/82 backdrop-blur">
        <nav
          aria-label="Điều hướng chính"
          className="mx-auto flex max-w-[1120px] items-center justify-between px-4 py-4 md:px-8"
        >
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-85" aria-label="FormAuto Hub home">
            <span className="grid h-8 w-8 place-items-center rounded bg-blue-600 text-white">
              <BarChart3 size={18} />
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-950">FormAuto Hub</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#tinh-nang" className="motion-link hover:text-blue-600">
              Báo cáo
            </a>
            <a href="#quy-trinh" className="motion-link hover:text-blue-600">
              Quy trình
            </a>
            <a href="#an-toan" className="motion-link hover:text-blue-600">
              An toàn
            </a>
            <a href="#credit" className="motion-link hover:text-blue-600">
              Credit
            </a>
            <a href="#faq" className="motion-link hover:text-blue-600">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="motion-link text-sm font-medium text-slate-700 hover:text-blue-600">
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="motion-button inline-flex rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:px-4"
            >
              Bắt đầu
            </Link>
          </div>
        </nav>
      </header>

      <section className="border-b border-slate-200 bg-transparent">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-8 px-4 py-8 md:px-8 md:py-20 lg:grid-cols-2">
          <div className="min-w-0 space-y-8">
            <ScrollReveal>
            <p className="inline-flex rounded border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              GOOGLE FORMS CHO BÁO CÁO VÀ DEMO DỮ LIỆU
            </p>
            <h1 className="mb-6 mt-6 max-w-[22rem] break-words text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:max-w-3xl sm:text-4xl md:text-5xl">
              Tạo dữ liệu phản hồi mẫu cho Google Forms của bạn
            </h1>
            <p className="mt-6 max-w-[22rem] text-base leading-8 text-slate-600 sm:max-w-2xl md:text-lg">
              Kiểm thử form, demo dashboard và rà soát dữ liệu trước khi gửi khảo sát thật. Không
              dùng để làm giả kết quả báo cáo, spam form hoặc né giới hạn của Google.
            </p>
            </ScrollReveal>
            <ScrollReveal delay={90} className="flex max-w-[22rem] flex-col flex-wrap gap-4 sm:max-w-none sm:flex-row">
              <Link
                href="/register"
                className="motion-button rounded bg-blue-600 px-6 py-2.5 text-center text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Bắt đầu với 5 credit
              </Link>
              <Link
                href="/google-forms/student-report"
                className="motion-button rounded border border-slate-200 bg-white px-6 py-2.5 text-center text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Xem cho báo cáo sinh viên
              </Link>
            </ScrollReveal>
            <ScrollReveal delay={160} className="hidden max-w-[22rem] flex-wrap gap-3 border-t border-slate-100 pt-6 sm:flex sm:max-w-none">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <Eye size={16} />
                Dữ liệu mẫu để kiểm thử
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <ListChecks size={16} />
                Preview 1-100 phản hồi
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                <Wallet size={16} />
                Theo dõi credit
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                <ShieldCheck size={16} />
                Không làm giả khảo sát
              </span>
            </ScrollReveal>
          </div>

          <ScrollReveal className="relative hidden sm:block" delay={140} variant="scale">
            <DashboardPreview />
          </ScrollReveal>
        </div>
      </section>

      <section id="quy-trinh" className="border-y border-slate-200 bg-white/45 py-12 md:py-20">
        <ScrollReveal className="mx-auto max-w-[1120px] px-4 text-center md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">
              Từ Google Form đến dữ liệu mẫu có thể kiểm tra
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-slate-600">
              Mỗi thao tác đều đi qua bước phân tích, preview, giới hạn và xác nhận rõ ràng.
            </p>
          </div>
          <div className="relative grid gap-4 md:grid-cols-5">
            <div className="absolute left-[10%] right-[10%] top-12 z-0 hidden h-px bg-slate-200 md:block" />
            {workflowSteps.map((step, index) => (
              <ScrollReveal key={step.title} delay={index * 70} as="article" className="motion-card relative z-10 rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600 shadow-sm">
                  <step.icon size={20} />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-slate-900">{step.title}</h3>
              </ScrollReveal>
            ))}
          </div>
        </ScrollReveal>
      </section>

      <section className="mx-auto max-w-[1120px] px-4 py-12 md:px-8 md:py-20">
        <ScrollReveal className="mb-10 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Các trường hợp sử dụng Google Forms phổ biến
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Các trang dưới đây là nhóm nội dung chính để Google index từng nhu cầu riêng: tạo dữ
            liệu mẫu, demo khảo sát, báo cáo sinh viên và kiểm tra dữ liệu trong Google Sheets.
          </p>
        </ScrollReveal>
        <div className="grid gap-4 md:grid-cols-2">
          {seoUseCaseLinks.map((item, index) => (
            <ScrollReveal key={item.href} delay={(index % 2) * 70} as="article" className="motion-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <Link href={item.href} className="text-base font-semibold text-blue-700 hover:underline">
                {item.title}
              </Link>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section id="tinh-nang" className="mx-auto max-w-[1120px] px-4 py-12 md:px-8 md:py-20">
          <ScrollReveal className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">
              Dành cho sinh viên, nhóm học tập và người làm khảo sát nhỏ
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Cùng một app, nhiều tình huống: test form, demo dữ liệu, kiểm tra sheet và chuẩn bị báo cáo.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={(index % 3) * 80} as="article" className={`motion-card rounded-lg border border-slate-200 bg-white p-6 shadow-sm ${index > 2 ? "hidden md:block" : ""}`}>
                <div className="motion-icon mb-4 flex h-10 w-10 items-center justify-center rounded border border-blue-100 bg-blue-50 text-blue-600">
                  <feature.icon size={20} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{feature.body}</p>
              </ScrollReveal>
            ))}
          </div>
      </section>

      <section className="hidden border-y border-slate-200 bg-white/45 py-12 md:block md:py-20">
        <ScrollReveal className="mx-auto max-w-[1120px] px-4 md:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">
              Theo dõi credit, lượt dùng và bản xem trước trong một dashboard
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Dành cho nhóm cần nhìn rõ dữ liệu mẫu, credit và lịch sử thao tác trước khi chạy khảo sát thật.
            </p>
          </div>
          <LandingDashboardTabs />
        </ScrollReveal>
      </section>

      <section id="an-toan" className="mx-auto max-w-[1120px] px-4 py-12 md:px-8 md:py-20">
        <ScrollReveal className="grid grid-cols-1 items-center gap-12 rounded-lg border border-slate-200 bg-white p-8 shadow-sm md:p-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-slate-900">
              Thiết kế xoay quanh giới hạn, rà soát và khả năng truy vết
            </h2>
            <p className="mb-8 text-base leading-relaxed text-slate-600">
              FormAuto Hub giữ quy trình phản hồi trong phạm vi kiểm soát bằng bước xem trước, xác
              nhận, giới hạn thao tác và lịch sử kiểm tra. Dữ liệu mẫu không thay thế phản hồi thật
              trong báo cáo học thuật.
            </p>
            <ul className="space-y-4">
              {[
                "Xem trước trước khi gửi",
                "Cần người dùng xác nhận",
                "1-100 câu trả lời xem trước mỗi thao tác",
                "Ghi nhật ký sử dụng cho thao tác công cụ",
                "Không dùng dữ liệu mẫu như kết quả khảo sát thật"
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 text-blue-600" size={20} />
                  <span className="text-sm text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-red-600">
              <ShieldCheck size={20} />
              Không hỗ trợ
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              {[
                "Không có công cụ spam",
                "Không vượt captcha",
                "Không xoay proxy",
                "Không tạo tài khoản giả",
                "Không làm giả dữ liệu khảo sát"
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </section>

      <section id="credit" className="hidden border-y border-slate-200 bg-white/45 py-12 md:block md:py-20">
        <ScrollReveal className="mx-auto max-w-[1120px] px-4 md:px-8">
          <h2 className="mx-auto mb-12 max-w-3xl text-center text-3xl font-bold tracking-tight text-slate-900">
              Mô hình credit rõ ràng cho từng thao tác
          </h2>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {creditCards.map((item, index) => (
              <ScrollReveal key={item.title} delay={index * 80} as="article" className="motion-card rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="motion-icon mb-4 flex h-10 w-10 items-center justify-center rounded border border-blue-100 bg-blue-50 text-blue-600">
                  <item.icon size={20} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {item.body}
                </p>
              </ScrollReveal>
            ))}
          </div>
          <p className="text-center text-sm italic text-slate-500">
            Thanh toán PayOS được xác minh trước khi credit được cộng vào tài khoản.
          </p>
        </ScrollReveal>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-20">
          <ScrollReveal>
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-slate-900">
            Câu hỏi thường gặp
          </h2>
          </ScrollReveal>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <ScrollReveal key={faq.question} delay={index * 45}>
              <details className="motion-details group rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-slate-900">
                  {faq.question}
                  <span className="text-slate-400 transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </details>
              </ScrollReveal>
            ))}
          </div>
      </section>

      <section className="mx-auto mb-20 hidden max-w-[1120px] px-4 md:block md:px-8">
        <ScrollReveal className="rounded-lg border border-blue-100 bg-blue-50 px-6 py-16 text-center shadow-sm" variant="scale">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Bắt đầu với quy trình biểu mẫu có kiểm soát
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-blue-900/70">
            Tạo dữ liệu mẫu để kiểm thử, demo và chuẩn bị báo cáo mà vẫn giữ preview, giới hạn và log rõ ràng.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="motion-button rounded bg-blue-600 px-8 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Bắt đầu với 5 credit
            </Link>
            <Link
              href="/anti-abuse"
              className="motion-button rounded border border-blue-200 bg-white px-8 py-3 text-sm font-medium text-blue-900 shadow-sm hover:bg-blue-50"
            >
              Xem chính sách chống lạm dụng
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <Footer />
    </main>
  );
}

function DashboardPreview() {
  const nextActions = [
    "Phân tích link Google Form và cài đặt cách trả lời",
    "Nạp credit hoặc theo dõi giao dịch PayOS",
    "Kiểm tra lịch sử sử dụng và hành động bị chặn"
  ];

  return (
    <div className="motion-float flex h-[420px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl sm:h-[520px]">
      <div className="flex h-12 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-slate-200" />
          <span className="h-3 w-3 rounded-full bg-slate-200" />
          <span className="h-3 w-3 rounded-full bg-slate-200" />
        </div>
        <span className="max-w-[160px] truncate text-xs font-medium text-slate-500 sm:max-w-none">
          app.formautohub.com
        </span>
        <div className="w-12" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-48 space-y-6 border-r border-slate-100 bg-white p-4 text-xs text-slate-600 sm:block">
          <div className="space-y-1">
            <p className="rounded bg-blue-50 px-2 py-1.5 font-semibold text-blue-600">Tổng quan</p>
            <p className="rounded px-2 py-1.5">Yêu cầu nạp credit</p>
            <p className="rounded px-2 py-1.5">Nhật ký sử dụng</p>
            <p className="rounded px-2 py-1.5">Giao dịch credit</p>
            <p className="rounded px-2 py-1.5">Hồ sơ</p>
          </div>
        </aside>
        <div className="min-w-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/30 p-4 sm:space-y-6 sm:p-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Tổng quan vận hành</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Theo dõi credit, yêu cầu nạp và các thao tác biểu mẫu gần đây.
            </p>
          </div>
          <div className="rounded border border-cyan-100 bg-cyan-50 px-3 py-2 text-[11px] leading-5 text-cyan-900">
            Tự động hóa biểu mẫu luôn phải xem trước, người dùng phải xác nhận rõ ràng, và mỗi lần chỉ tạo 1 đến 100 câu trả lời xem trước.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Metric label="Credit hiện có" value="-" />
            <Metric label="Đã nạp" value="-" />
            <Metric label="Đã dùng" value="-" />
            <Metric label="Yêu cầu chờ duyệt" value="-" />
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.35fr]">
            <div className="rounded-lg border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Việc nên làm tiếp</h3>
              </div>
              <div className="space-y-2 p-4">
                {nextActions.map((action) => (
                  <div key={action} className="rounded border border-slate-200 bg-white px-3 py-2 text-[11px] leading-5 text-slate-700">
                    {action}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Yêu cầu nạp gần đây</h3>
              </div>
              <EmptyPreview
                title="Chưa có yêu cầu nạp gần đây"
                detail="Nạp thêm credit khi cần tiếp tục sử dụng."
              />
            </div>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Lịch sử sử dụng gần đây</h3>
            </div>
            <EmptyPreview
              title="Chưa có lịch sử sử dụng gần đây"
              detail="Các lần phân tích, tạo bản xem trước và gửi câu trả lời sẽ xuất hiện tại đây."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyPreview({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="m-4 rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function Footer() {
  const groups = [
    {
      title: "Sản phẩm",
      links: [
        { label: "Tạo dữ liệu mẫu cho Google Forms", href: "/google-forms/sample-data" },
        { label: "Dữ liệu mẫu Google Forms cho báo cáo sinh viên", href: "/google-forms/student-report" },
        { label: "Demo dữ liệu khảo sát Google Forms", href: "/google-forms/survey-demo" },
        { label: "Kiểm tra dữ liệu Google Forms trong Google Sheets", href: "/google-forms/sheets-report" }
      ]
    },
    {
      title: "Tài nguyên",
      links: [
        { label: "Chống lạm dụng", href: "/anti-abuse" },
        { label: "FAQ", href: "#faq" },
        { label: "Quy trình", href: "#quy-trinh" }
      ]
    },
    {
      title: "Tài khoản",
      links: [
        { label: "Đăng nhập", href: "/login" },
        { label: "Tạo tài khoản", href: "/register" }
      ]
    },
    {
      title: "Pháp lý",
      links: [
        { label: "Điều khoản", href: "#" },
        { label: "Quyền riêng tư", href: "#" }
      ]
    }
  ];

  return (
    <footer className="border-t border-slate-200 bg-white/82 backdrop-blur">
      <div className="mx-auto grid max-w-[1120px] grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4 md:px-8">
        {groups.map((group) => (
          <div key={group.title}>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-900">{group.title}</h4>
            <ul className="space-y-3">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-600 transition-colors hover:text-blue-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-4 border-t border-slate-200 px-4 py-6 md:flex-row md:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white">
            <BarChart3 size={14} />
          </div>
          <span className="text-sm font-semibold text-slate-900">FormAuto Hub</span>
        </div>
        <p className="text-sm text-slate-500">© 2026 FormAuto Hub. Đã đăng ký bản quyền.</p>
      </div>
    </footer>
  );
}
