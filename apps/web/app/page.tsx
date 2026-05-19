import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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

const siteName = "FormAuto Hub";
const title = "FormAuto Hub | Xem trước và theo dõi phản hồi Google Forms";
const description =
  "FormAuto Hub giúp đội nhóm phân tích biểu mẫu, cấu hình quy tắc trả lời, xem trước phản hồi và theo dõi credit trước mọi thao tác được xác nhận.";

const workflowSteps = [
  { title: "Thêm URL biểu mẫu", icon: LinkIcon },
  { title: "Nhận diện câu hỏi", icon: FileSearch },
  { title: "Cấu hình quy tắc", icon: ListChecks },
  { title: "Xem trước phản hồi", icon: Eye },
  { title: "Xác nhận gửi", icon: CheckCircle2 }
];

const featureCards = [
  {
    title: "Phân tích biểu mẫu",
    body: "Đọc cấu trúc biểu mẫu và nhận diện các loại câu hỏi được hỗ trợ.",
    icon: BarChart3
  },
  {
    title: "Quy tắc trả lời",
    body: "Cấu hình chế độ ngẫu nhiên, phần trăm, số lượng và dòng văn bản mẫu.",
    icon: ClipboardList
  },
  {
    title: "Xem trước phản hồi",
    body: "Rà soát câu trả lời đã tạo trước mọi thao tác gửi được xác nhận.",
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
    title: "Duyệt nạp credit",
    body: "Rà soát yêu cầu nạp credit thủ công trong luồng MVP.",
    icon: ShieldCheck
  }
];

const creditCards = [
  {
    title: "Nạp credit",
    body: "Tạo yêu cầu nạp credit thủ công để quản trị viên rà soát.",
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
      "Không. MVP yêu cầu xem trước và người dùng xác nhận trước khi gửi."
  },
  {
    question: "Có thể tạo bao nhiêu phản hồi mỗi lần?",
    answer: "MVP giới hạn từ 1 đến 5 phản hồi được tạo trong mỗi thao tác."
  },
  {
    question: "MVP có cổng thanh toán tự động chưa?",
    answer:
      "Chưa. Payment gateway đang Deferred; MVP dùng yêu cầu nạp credit thủ công và quản trị viên duyệt."
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
    "quản lý Google Forms",
    "xem trước phản hồi",
    "credit dashboard",
    "form automation có kiểm soát"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title,
    description,
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
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "vi-VN",
    description,
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

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav
          aria-label="Điều hướng chính"
          className="mx-auto flex max-w-[1120px] items-center justify-between px-4 py-4 md:px-8"
        >
          <Link href="/" className="flex items-center gap-3" aria-label="FormAuto Hub home">
            <span className="grid h-8 w-8 place-items-center rounded bg-blue-600 text-white">
              <BarChart3 size={18} />
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-950">FormAuto Hub</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#tinh-nang" className="hover:text-blue-600">
              Tính năng
            </a>
            <a href="#quy-trinh" className="hover:text-blue-600">
              Quy trình
            </a>
            <a href="#an-toan" className="hover:text-blue-600">
              An toàn
            </a>
            <a href="#credit" className="hover:text-blue-600">
              Credit
            </a>
            <a href="#faq" className="hover:text-blue-600">
              FAQ
            </a>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-blue-600">
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Bắt đầu miễn phí
            </Link>
          </div>
        </nav>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-2">
          <div className="min-w-0 space-y-8">
            <div>
            <p className="inline-flex rounded border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              QUY TRÌNH GOOGLE FORMS CÓ KIỂM SOÁT
            </p>
            <h1 className="mb-6 mt-6 max-w-[22rem] break-words text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:max-w-3xl md:text-5xl">
              Xem trước, xác nhận và theo dõi quy trình phản hồi Google Forms
            </h1>
            <p className="mt-6 max-w-[22rem] text-base leading-8 text-slate-600 sm:max-w-2xl md:text-lg">
              FormAuto Hub giúp đội nhóm phân tích biểu mẫu, cấu hình quy tắc trả lời, xem trước
              các lô phản hồi nhỏ và theo dõi credit trước mọi thao tác được xác nhận.
            </p>
            </div>
            <div className="flex max-w-[22rem] flex-col flex-wrap gap-4 sm:max-w-none sm:flex-row">
              <Link
                href="/register"
                className="rounded bg-blue-600 px-6 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Bắt đầu miễn phí
              </Link>
              <a
                href="#quy-trinh"
                className="rounded border border-slate-200 bg-white px-6 py-2.5 text-center text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                Xem quy trình
              </a>
            </div>
            <div className="flex max-w-[22rem] flex-wrap gap-3 border-t border-slate-100 pt-6 sm:max-w-none">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <Eye size={16} />
                Bắt buộc xem trước
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <ListChecks size={16} />
                1-5 phản hồi mỗi thao tác
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                <Wallet size={16} />
                Theo dõi credit
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                <ShieldCheck size={16} />
                Không hỗ trợ spam hoặc né giới hạn
              </span>
            </div>
          </div>

          <div className="relative lg:block">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <section id="quy-trinh" className="border-y border-slate-200 bg-slate-50 py-12 md:py-20">
        <div className="mx-auto max-w-[1120px] px-4 text-center md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">
              Quy trình an toàn từ liên kết biểu mẫu đến thao tác xác nhận
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-slate-600">
              Mỗi thao tác đều đi qua bước rà soát, giới hạn và theo dõi trước khi gửi.
            </p>
          </div>
          <div className="relative grid gap-4 md:grid-cols-5">
            <div className="absolute left-[10%] right-[10%] top-12 z-0 hidden h-px bg-slate-200 md:block" />
            {workflowSteps.map((step) => (
              <article key={step.title} className="relative z-10 rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600 shadow-sm">
                  <step.icon size={20} />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-slate-900">{step.title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="tinh-nang" className="mx-auto max-w-[1120px] bg-white px-4 py-12 md:px-8 md:py-20">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">
              Xây dựng cho vận hành biểu mẫu có kiểm soát
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Tất cả những gì cần để quản lý biểu mẫu, bản xem trước, credit và lịch sử hoạt động trong một dashboard.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <article key={feature.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded border border-blue-100 bg-blue-50 text-blue-600">
                  <feature.icon size={20} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{feature.body}</p>
              </article>
            ))}
          </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-12 md:py-20">
        <div className="mx-auto max-w-[1120px] px-4 md:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">
              Theo dõi credit, lượt dùng và bản xem trước trong một bảng điều khiển vận hành
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Dành cho người vận hành và quản trị viên cần nhìn rõ dữ liệu trước khi hành động.
            </p>
          </div>
          <div className="mx-auto w-full max-w-5xl rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded border border-slate-100 bg-white">
              <div className="absolute inset-0 flex flex-col gap-4 p-4">
                <div className="flex gap-4 border-b border-slate-100 pb-2">
                  <span className="border-b-2 border-blue-600 pb-2 text-xs font-bold text-blue-600">Tổng quan</span>
                  <span className="text-xs text-slate-500">Đơn nạp</span>
                  <span className="text-xs text-slate-500">Sử dụng</span>
                  <span className="text-xs text-slate-500">Credit</span>
                </div>
                <Image
                  src="/images/landing/login-screen.png"
                  alt="Ảnh chụp web thật của FormAuto Hub được dùng thay ảnh placeholder trong landing"
                  width={1440}
                  height={1000}
                  className="h-auto w-full rounded object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="an-toan" className="mx-auto max-w-[1120px] bg-white px-4 py-12 md:px-8 md:py-20">
        <div className="grid grid-cols-1 items-center gap-12 rounded-lg border border-slate-200 bg-white p-8 shadow-sm md:p-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-slate-900">
              Thiết kế xoay quanh giới hạn, rà soát và khả năng truy vết
            </h2>
            <p className="mb-8 text-base leading-relaxed text-slate-600">
              FormAuto Hub giữ quy trình phản hồi trong phạm vi kiểm soát bằng bước xem trước, xác
              nhận, giới hạn thao tác và lịch sử kiểm tra trước mọi hành động gửi.
            </p>
            <ul className="space-y-4">
              {[
                "Xem trước trước khi gửi",
                "Cần người dùng xác nhận",
                "1-5 phản hồi mỗi thao tác",
                "Ghi nhật ký sử dụng cho thao tác công cụ",
                "Ghi giao dịch credit cho thay đổi số dư"
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
                "Không gửi biểu mẫu trái phép"
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="credit" className="border-y border-slate-200 bg-slate-50 py-12 md:py-20">
        <div className="mx-auto max-w-[1120px] px-4 md:px-8">
          <h2 className="mx-auto mb-12 max-w-3xl text-center text-3xl font-bold tracking-tight text-slate-900">
              Mô hình dùng credit, không phụ thuộc cổng thanh toán trong MVP
          </h2>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {creditCards.map((item) => (
              <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded border border-blue-100 bg-blue-50 text-blue-600">
                  <item.icon size={20} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
          <p className="text-center text-sm italic text-slate-500">
            Tích hợp cổng thanh toán được để lại cho giai đoạn sau.
          </p>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl bg-white px-4 py-12 md:px-8 md:py-20">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-slate-900">
            Câu hỏi thường gặp
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-slate-900">
                  {faq.question}
                  <span className="text-slate-400 transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
      </section>

      <section className="mx-auto mb-20 max-w-[1120px] bg-white px-4 md:px-8">
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-6 py-16 text-center shadow-sm">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Bắt đầu với quy trình biểu mẫu có kiểm soát
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-blue-900/70">
            Xem trước phản hồi, xác nhận thao tác và theo dõi credit rõ ràng ngay từ đầu.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded bg-blue-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Bắt đầu miễn phí
            </Link>
            <a
              href="#quy-trinh"
              className="rounded border border-blue-200 bg-white px-8 py-3 text-sm font-medium text-blue-900 shadow-sm transition-colors hover:bg-blue-50"
            >
              Xem quy trình
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function DashboardPreview() {
  const logs = [
    ["Phân tích biểu mẫu", "Thành công", "2 credit"],
    ["Xem trước phản hồi", "Thành công", "5 credit"],
    ["Yêu cầu nạp credit", "Đang chờ", "500 credit"],
    ["Rà soát gửi phản hồi", "Thất bại", "0 credit"]
  ];

  return (
    <div className="flex h-[520px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
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
        <div className="min-w-0 flex-1 space-y-6 overflow-y-auto bg-slate-50/30 p-5">
          <h2 className="text-sm font-bold text-slate-900">Bảng điều khiển</h2>
          <div className="grid grid-cols-2 gap-4">
            <Metric label="Credit hiện có" value="1,250" />
            <Metric label="Yêu cầu đang chờ" value="3" />
            <Metric label="Lượt dùng tháng này" value="48" />
            <Metric label="Tỷ lệ thành công" value="96%" />
          </div>
          <div className="rounded-lg border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-50 px-4 py-3">
              <h3 className="text-xs font-semibold text-slate-900">Nhật ký gần đây</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {logs.map(([action, status, credit]) => (
                <div key={action} className="grid grid-cols-[1fr_76px_70px] gap-2 px-4 py-2.5 text-[11px]">
                  <span className="min-w-0 text-slate-700">{action}</span>
                  <span
                    className={
                      status === "Đang chờ"
                        ? "rounded bg-amber-50 px-1.5 py-0.5 text-center text-[10px] font-medium text-amber-700"
                        : status === "Thất bại"
                          ? "rounded bg-red-50 px-1.5 py-0.5 text-center text-[10px] font-medium text-red-700"
                          : "rounded bg-emerald-50 px-1.5 py-0.5 text-center text-[10px] font-medium text-emerald-700"
                    }
                  >
                    {status}
                  </span>
                  <span className="text-slate-500">{credit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-blue-900">Bản xem trước phản hồi</h3>
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                Batch #104
              </span>
            </div>
            <div className="space-y-1.5">
              {["Nguyễn Văn A | 24 | Kỹ thuật", "Trần Thị B | 30 | Marketing", "Lê Văn C | 28 | Thiết kế"].map(
                (item) => (
                  <div key={item} className="rounded border border-blue-100/50 bg-white p-2 text-[10px] text-slate-600">
                    {item}
                  </div>
                )
              )}
            </div>
            <button className="w-full rounded border border-blue-200 bg-white py-2 text-[11px] font-semibold text-blue-600 transition-colors hover:bg-blue-50">
              Xác nhận sau khi rà soát
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
      <p className="text-[10px] font-medium uppercase text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Footer() {
  const groups = [
    { title: "Sản phẩm", links: ["Tính năng", "Quy trình", "An toàn", "Credit"] },
    { title: "Tài nguyên", links: ["Tài liệu", "FAQ", "Hỗ trợ"] },
    { title: "Tài khoản", links: ["Đăng nhập", "Tạo tài khoản"] },
    { title: "Pháp lý", links: ["Điều khoản", "Quyền riêng tư"] }
  ];

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-[1120px] grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4 md:px-8">
        {groups.map((group) => (
          <div key={group.title}>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-900">{group.title}</h4>
            <ul className="space-y-3">
              {group.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-slate-600 transition-colors hover:text-blue-600">
                    {link}
                  </a>
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
