import Link from "next/link";
import Image from "next/image";
import { ScrollReveal } from "@/components/scroll-reveal";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  FileSearch,
  GraduationCap,
  ListChecks,
  Presentation,
  ShieldCheck,
  Sparkles,
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

const seoAccents = [
  {
    card: "border-info-border bg-gradient-to-br from-surface via-info-surface/70 to-surface hover:border-info-border",
    icon: "border-info-border bg-accent text-inverse-foreground shadow-raised",
    chip: "border-info-border bg-info-surface text-info",
    line: "from-accent to-accent"
  },
  {
    card: "border-success-border bg-gradient-to-br from-surface via-success-surface/70 to-surface hover:border-success-border",
    icon: "border-success-border bg-success text-inverse-foreground shadow-raised",
    chip: "border-success-border bg-success-surface text-success",
    line: "from-success to-accent"
  },
  {
    card: "border-warning-border bg-gradient-to-br from-surface via-warning-surface/75 to-surface hover:border-warning-border",
    icon: "border-warning-border bg-warning text-inverse-foreground shadow-raised",
    chip: "border-warning-border bg-warning-surface text-warning",
    line: "from-warning to-warning"
  },
  {
    card: "border-primary-border bg-gradient-to-br from-surface via-primary-soft/65 to-surface hover:border-primary-border",
    icon: "border-primary-border bg-primary text-inverse-foreground shadow-raised",
    chip: "border-primary-border bg-primary-soft text-primary",
    line: "from-primary to-primary-hover"
  }
];

const useCaseIcons = [GraduationCap, Presentation, BarChart3, FileSearch];

function getSeoAccent(index: number) {
  return seoAccents[index % seoAccents.length];
}

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
    <main className="app-aura-bg min-h-screen text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHeader />

      <section className="border-b border-border bg-transparent">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-8 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <ScrollReveal className="min-w-0">
            <p className="inline-flex rounded border border-info-border bg-info-surface px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-info">
              {config.eyebrow}
            </p>
            <h1 className="mt-6 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {config.h1}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-secondary-foreground md:text-lg">
              {config.lead}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="motion-button rounded bg-primary px-6 py-2.5 text-center text-sm font-medium text-inverse-foreground shadow-sm hover:bg-primary"
              >
                Bắt đầu
              </Link>
              <Link
                href="/google-forms/sample-data"
                className="motion-button rounded border border-border bg-surface px-6 py-2.5 text-center text-sm font-medium text-secondary-foreground shadow-sm hover:bg-surface-subtle"
              >
                Xem dữ liệu mẫu
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal as="aside" delay={120} variant="scale" className="motion-card overflow-hidden rounded-lg border border-info-border bg-gradient-to-br from-surface via-info-surface/80 to-success-surface/70 p-6 shadow-sm">
            <div className="relative mb-6 overflow-hidden rounded-lg border border-inverse-foreground/70 bg-surface shadow-sm">
              <Image
                src="/images/landing/login-screen.png"
                alt="Giao diện FormAuto Hub"
                width={1440}
                height={1000}
                className="h-36 w-full object-cover object-top"
                priority={false}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface-inverse/55 to-transparent p-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-surface/92 px-3 py-1 text-xs font-semibold text-info">
                  <Sparkles size={14} />
                  Mẫu giao diện
                </span>
              </div>
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Từ khóa liên quan</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {[config.primaryKeyword, ...config.secondaryKeywords].map((keyword, index) => {
                const accent = getSeoAccent(index);

                return (
                <span
                  key={keyword}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${accent.chip}`}
                >
                  {keyword}
                </span>
                );
              })}
            </div>
            <div className="mt-6 rounded border border-success-border bg-surface/78 p-4 text-sm leading-6 text-success shadow-sm">
              Dữ liệu mẫu chỉ dùng để kiểm thử, demo hoặc chuẩn bị báo cáo. Không dùng để làm giả
              kết quả khảo sát hoặc thay thế phản hồi thật.
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1120px] grid-cols-1 gap-8 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-[0.75fr_1.25fr]">
        <ScrollReveal>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Phù hợp khi cần</h2>
          <p className="mt-4 text-base leading-7 text-secondary-foreground">
            Các tình huống bên dưới bám đúng phạm vi sản phẩm: dữ liệu mẫu, preview, xác nhận và
            lịch sử thao tác rõ ràng.
          </p>
        </ScrollReveal>
        <div className="grid gap-4 md:grid-cols-3">
          {config.useCases.map((item, index) => {
            const accent = getSeoAccent(index);
            const Icon = useCaseIcons[index] ?? CheckCircle2;

            return (
            <ScrollReveal key={item} delay={index * 70} as="article" className={`motion-card overflow-hidden rounded-lg border p-5 shadow-sm ${accent.card}`}>
              <div className={`motion-icon mb-4 flex h-11 w-11 items-center justify-center rounded-lg border shadow-lg ${accent.icon}`}>
                <Icon size={20} />
              </div>
              <h3 className="text-sm font-semibold leading-6 text-foreground">{item}</h3>
            </ScrollReveal>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-surface/45 py-12 md:py-20">
        <div className="mx-auto max-w-[1120px] px-4 md:px-8">
          <ScrollReveal className="mb-10 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Cách FormAuto Hub hỗ trợ</h2>
            <p className="mt-4 text-base leading-7 text-secondary-foreground">
              Nội dung trang tập trung vào nhu cầu học tập và báo cáo, nhưng vẫn bám product
              baseline: phân tích, cấu hình, preview, xác nhận và theo dõi.
            </p>
          </ScrollReveal>
          <div className="grid gap-6 md:grid-cols-3">
            {config.features.map((feature, index) => {
              const Icon = [FileSearch, ListChecks, Wallet][index] ?? BarChart3;
              const accent = getSeoAccent(index);

              return (
                <ScrollReveal key={feature.title} delay={index * 80} as="article" className={`motion-card relative overflow-hidden rounded-lg border p-6 shadow-sm ${accent.card}`}>
                  <div className={`absolute right-4 top-4 h-16 w-16 rounded-full bg-gradient-to-br ${accent.line} opacity-10`} />
                  <div className={`motion-icon mb-4 flex h-12 w-12 items-center justify-center rounded-lg border shadow-lg ${accent.icon}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-secondary-foreground">{feature.body}</p>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-4 py-12 md:px-8 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Hướng dẫn theo use case</h2>
            <p className="mt-4 text-base leading-7 text-secondary-foreground">
              Các nội dung bên dưới giúp Google và AI search hiểu rõ trang này dành cho ai, giải
              quyết vấn đề gì và giới hạn sử dụng an toàn ở đâu.
            </p>
          </ScrollReveal>
          <div className="space-y-6">
            {config.contentSections.map((section, index) => {
              const accent = getSeoAccent(index + 1);

              return (
              <ScrollReveal key={section.heading} delay={index * 70} as="article" className={`motion-card overflow-hidden rounded-lg border p-6 shadow-sm ${accent.card}`}>
                <div className={`mb-5 h-1.5 w-16 rounded-full bg-gradient-to-r ${accent.line}`} />
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{section.heading}</h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-secondary-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1120px] grid-cols-1 gap-8 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-2">
        <ScrollReveal className="motion-card rounded-lg border border-success-border bg-gradient-to-br from-surface via-success-surface/70 to-surface p-6 shadow-sm md:p-8">
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <ShieldCheck className="text-success" size={24} />
            Giới hạn an toàn
          </h2>
          <ul className="mt-6 space-y-3">
            {safetyItems.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-6 text-secondary-foreground">
                <CheckCircle2 className="mt-0.5 shrink-0 text-success" size={18} />
                {item}
              </li>
            ))}
          </ul>
        </ScrollReveal>

        <ScrollReveal delay={100} className="rounded-lg border border-primary-border bg-gradient-to-br from-surface via-primary-soft/70 to-surface p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Trang liên quan</h2>
          <div className="mt-6 grid gap-3">
            {relatedLinks
              .filter((link) => link.href !== `/${config.slug}`)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="motion-button flex items-center justify-between gap-3 rounded border border-inverse-foreground/70 bg-surface px-4 py-3 text-sm font-medium text-secondary-foreground shadow-sm hover:border-primary-border hover:text-primary"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="shrink-0 text-muted-foreground" size={16} />
                </Link>
              ))}
          </div>
        </ScrollReveal>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 md:px-8 md:pb-24">
        <ScrollReveal>
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-foreground">Câu hỏi thường gặp</h2>
        </ScrollReveal>
        <div className="space-y-4">
          {config.faqs.map((faq, index) => (
            <ScrollReveal key={faq.question} delay={index * 45}>
            <details className="motion-details group rounded-lg border border-border bg-surface p-5 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-foreground">
                {faq.question}
                <span className="text-muted-foreground transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-4 text-sm leading-7 text-secondary-foreground">{faq.answer}</p>
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
    <header className="sticky top-0 z-30 border-b border-border bg-surface/82 backdrop-blur">
      <nav
        aria-label="Điều hướng chính"
        className="mx-auto flex max-w-[1120px] items-center justify-between px-4 py-4 md:px-8"
      >
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-85" aria-label="FormAuto Hub home">
          <span className="grid h-8 w-8 place-items-center rounded bg-primary text-inverse-foreground">
            <BarChart3 size={18} />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">FormAuto Hub</span>
        </Link>
        <div className="hidden items-center gap-6 text-sm font-medium text-secondary-foreground md:flex">
          <Link href="/google-forms/student-report" className="motion-link hover:text-info">
            Báo cáo
          </Link>
          <Link href="/google-forms/survey-demo" className="motion-link hover:text-info">
            Demo dữ liệu
          </Link>
          <Link href="/google-forms/sheets-report" className="motion-link hover:text-info">
            Sheets
          </Link>
          <Link href="/anti-abuse" className="motion-link hover:text-info">
            Chống lạm dụng
          </Link>
        </div>
        <Link
          href="/register"
          className="motion-button inline-flex rounded-md bg-primary px-3 py-2 text-sm font-semibold text-inverse-foreground shadow-sm hover:bg-primary sm:px-4"
        >
          Bắt đầu
        </Link>
      </nav>
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface/82 backdrop-blur">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-inverse-foreground">
            <BarChart3 size={14} />
          </div>
          <span className="text-sm font-semibold text-foreground">FormAuto Hub</span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-secondary-foreground">
          <Link href="/google-forms/student-report" className="motion-link hover:text-info">
            Báo cáo sinh viên
          </Link>
          <Link href="/google-forms/survey-demo" className="motion-link hover:text-info">
            Demo khảo sát
          </Link>
          <Link href="/google-forms/sample-data" className="motion-link hover:text-info">
            Dữ liệu mẫu
          </Link>
          <Link href="/anti-abuse" className="motion-link hover:text-info">
            Chống lạm dụng
          </Link>
        </div>
      </div>
    </footer>
  );
}
