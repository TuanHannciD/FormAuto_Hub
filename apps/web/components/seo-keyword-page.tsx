import Link from "next/link";
import { ScrollReveal } from "@/components/scroll-reveal";
import {
  BarChart3,
  CheckCircle2,
  FileSearch,
  ListChecks,
  ShieldCheck,
  Wallet
} from "lucide-react";
import type { SeoPageConfig } from "@/lib/seo-pages";
import { siteUrl } from "@/lib/site";

type SeoKeywordPageProps = {
  config: SeoPageConfig;
};

const relatedLinks = [
  { href: "/google-forms/sample-data", label: "Tạo dữ liệu mẫu cho Google Forms" },
  { href: "/google-forms/student-report", label: "Dữ liệu mẫu Google Forms cho báo cáo sinh viên" },
  { href: "/google-forms/survey-demo", label: "Demo dữ liệu khảo sát Google Forms" },
  { href: "/google-forms/sheets-report", label: "Kiểm tra dữ liệu Google Forms trong Google Sheets" },
  { href: "/anti-abuse", label: "Chính sách chống lạm dụng Google Forms automation" }
];

const safetyItems = [
  "Chỉ dùng với biểu mẫu bạn sở hữu hoặc được phép kiểm thử",
  "Không dùng dữ liệu mẫu như phản hồi khảo sát thật",
  "Không hỗ trợ spam, buff form hoặc gửi trái phép",
  "Không vượt captcha, xoay proxy hoặc tạo tài khoản giả",
  "Không bỏ qua bước xem trước và xác nhận"
];

export function SeoKeywordPage({ config }: SeoKeywordPageProps) {
  const pageUrl = `${siteUrl}/${config.slug}`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: config.title,
      url: pageUrl,
      inLanguage: "vi-VN",
      description: config.description,
      isPartOf: {
        "@type": "WebSite",
        name: "FormAuto Hub",
        url: siteUrl
      },
      about: config.primaryKeyword
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "FormAuto Hub",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description:
        "FormAuto Hub helps users create sample data for Google Forms to test forms, preview responses, demo Google Sheets dashboards, and prepare reports safely.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "VND"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: config.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer
        }
      }))
    }
  ];

  return (
    <main className="app-aura-bg min-h-screen text-slate-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHeader />

      <section className="border-b border-slate-200 bg-transparent">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-8 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <ScrollReveal className="min-w-0">
            <p className="inline-flex rounded border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              {config.eyebrow}
            </p>
            <h1 className="mt-6 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              {config.h1}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              {config.lead}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="motion-button rounded bg-blue-600 px-6 py-2.5 text-center text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Bắt đầu
              </Link>
              <Link
                href="/google-forms/sample-data"
                className="motion-button rounded border border-slate-200 bg-white px-6 py-2.5 text-center text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Xem dữ liệu mẫu
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal as="aside" delay={120} variant="scale" className="motion-card rounded-lg border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Từ khóa liên quan</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {[config.primaryKeyword, ...config.secondaryKeywords].map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {keyword}
                </span>
              ))}
            </div>
            <div className="mt-6 rounded border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">
              Dữ liệu mẫu chỉ dùng để kiểm thử, demo hoặc chuẩn bị báo cáo. Không dùng để làm giả
              kết quả khảo sát hoặc thay thế phản hồi thật.
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1120px] grid-cols-1 gap-8 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-[0.75fr_1.25fr]">
        <ScrollReveal>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Phù hợp khi cần</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Các tình huống bên dưới bám đúng phạm vi sản phẩm: dữ liệu mẫu, preview, xác nhận và
            lịch sử thao tác rõ ràng.
          </p>
        </ScrollReveal>
        <div className="grid gap-4 md:grid-cols-3">
          {config.useCases.map((item, index) => (
            <ScrollReveal key={item} delay={index * 70} as="article" className="motion-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <CheckCircle2 className="mb-4 text-blue-600" size={22} />
              <h3 className="text-sm font-semibold leading-6 text-slate-900">{item}</h3>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/45 py-12 md:py-20">
        <div className="mx-auto max-w-[1120px] px-4 md:px-8">
          <ScrollReveal className="mb-10 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Cách FormAuto Hub hỗ trợ</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Nội dung trang tập trung vào nhu cầu học tập và báo cáo, nhưng vẫn bám product
              baseline: phân tích, cấu hình, preview, xác nhận và theo dõi.
            </p>
          </ScrollReveal>
          <div className="grid gap-6 md:grid-cols-3">
            {config.features.map((feature, index) => {
              const Icon = [FileSearch, ListChecks, Wallet][index] ?? BarChart3;

              return (
                <ScrollReveal key={feature.title} delay={index * 80} as="article" className="motion-card rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="motion-icon mb-4 flex h-10 w-10 items-center justify-center rounded border border-blue-100 bg-blue-50 text-blue-600">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{feature.body}</p>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-4 py-12 md:px-8 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Hướng dẫn theo use case</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Các nội dung bên dưới giúp Google và AI search hiểu rõ trang này dành cho ai, giải
              quyết vấn đề gì và giới hạn sử dụng an toàn ở đâu.
            </p>
          </ScrollReveal>
          <div className="space-y-6">
            {config.contentSections.map((section, index) => (
              <ScrollReveal key={section.heading} delay={index * 70} as="article" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">{section.heading}</h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-slate-600">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1120px] grid-cols-1 gap-8 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-2">
        <ScrollReveal className="motion-card rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <ShieldCheck className="text-blue-600" size={24} />
            Giới hạn an toàn
          </h2>
          <ul className="mt-6 space-y-3">
            {safetyItems.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 shrink-0 text-blue-600" size={18} />
                {item}
              </li>
            ))}
          </ul>
        </ScrollReveal>

        <ScrollReveal delay={100} className="rounded-lg border border-slate-200 bg-slate-50 p-6 md:p-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Trang liên quan</h2>
          <div className="mt-6 grid gap-3">
            {relatedLinks
              .filter((link) => link.href !== `/${config.slug}`)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="motion-button rounded border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700"
                >
                  {link.label}
                </Link>
              ))}
          </div>
        </ScrollReveal>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 md:px-8 md:pb-24">
        <ScrollReveal>
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-slate-900">Câu hỏi thường gặp</h2>
        </ScrollReveal>
        <div className="space-y-4">
          {config.faqs.map((faq, index) => (
            <ScrollReveal key={faq.question} delay={index * 45}>
            <details className="motion-details group rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-900">
                {faq.question}
                <span className="text-slate-400 transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-4 text-sm leading-7 text-slate-600">{faq.answer}</p>
            </details>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}

function MarketingHeader() {
  return (
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
        <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/google-forms/student-report" className="motion-link hover:text-blue-600">
            Báo cáo
          </Link>
          <Link href="/google-forms/survey-demo" className="motion-link hover:text-blue-600">
            Demo dữ liệu
          </Link>
          <Link href="/google-forms/sheets-report" className="motion-link hover:text-blue-600">
            Sheets
          </Link>
          <Link href="/anti-abuse" className="motion-link hover:text-blue-600">
            Chống lạm dụng
          </Link>
        </div>
        <Link
          href="/register"
          className="motion-button inline-flex rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:px-4"
        >
          Bắt đầu
        </Link>
      </nav>
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/82 backdrop-blur">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white">
            <BarChart3 size={14} />
          </div>
          <span className="text-sm font-semibold text-slate-900">FormAuto Hub</span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <Link href="/google-forms/student-report" className="motion-link hover:text-blue-600">
            Báo cáo sinh viên
          </Link>
          <Link href="/google-forms/survey-demo" className="motion-link hover:text-blue-600">
            Demo khảo sát
          </Link>
          <Link href="/google-forms/sample-data" className="motion-link hover:text-blue-600">
            Dữ liệu mẫu
          </Link>
          <Link href="/anti-abuse" className="motion-link hover:text-blue-600">
            Chống lạm dụng
          </Link>
        </div>
      </div>
    </footer>
  );
}
