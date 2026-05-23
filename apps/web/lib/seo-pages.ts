import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";

export type SeoPageSlug =
  | "google-forms/student-report"
  | "google-forms/survey-demo"
  | "google-forms/sheets-report"
  | "google-forms/sample-data"
  | "anti-abuse";

export type SeoPageConfig = {
  slug: SeoPageSlug;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  lead: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  useCases: string[];
  features: Array<{
    title: string;
    body: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export const seoPages: Record<SeoPageSlug, SeoPageConfig> = {
  "google-forms/student-report": {
    slug: "google-forms/student-report",
    title: "Google Forms cho báo cáo sinh viên | FormAuto Hub",
    description:
      "Tạo dữ liệu phản hồi mẫu để kiểm tra Google Forms, Google Sheets và biểu đồ báo cáo trước khi thu thập phản hồi thật.",
    eyebrow: "Báo cáo sinh viên",
    h1: "Kiểm tra Google Forms và dữ liệu mẫu cho bài báo cáo",
    lead:
      "FormAuto Hub giúp sinh viên và nhóm học tập tạo bản xem trước phản hồi mẫu, kiểm tra form khảo sát và rà soát dữ liệu trước khi gửi khảo sát thật.",
    primaryKeyword: "google forms báo cáo sinh viên",
    secondaryKeywords: [
      "làm khảo sát bằng Google Form",
      "kiểm tra Google Form trước khi gửi",
      "dữ liệu mẫu cho bài báo cáo",
      "biểu đồ Google Sheets báo cáo"
    ],
    useCases: [
      "Kiểm tra form khảo sát trước khi gửi cho lớp hoặc nhóm",
      "Thử dữ liệu mẫu để xem bảng tính và biểu đồ có đúng không",
      "Chuẩn bị demo quy trình cho bài thuyết trình"
    ],
    features: [
      {
        title: "Kiểm tra câu hỏi",
        body: "Rà soát câu hỏi bắt buộc, lựa chọn, text field, ngày và giờ trước khi thu thập phản hồi thật."
      },
      {
        title: "Xem trước dữ liệu mẫu",
        body: "Tạo preview phản hồi mẫu theo quy tắc để nhìn trước dữ liệu xuất ra sẽ có dạng như thế nào."
      },
      {
        title: "Theo dõi thao tác",
        body: "Credit và lịch sử sử dụng giúp nhóm biết đã tạo preview khi nào và dùng bao nhiêu credit."
      }
    ],
    faqs: [
      {
        question: "FormAuto Hub có dùng để làm giả dữ liệu báo cáo không?",
        answer:
          "Không. FormAuto Hub chỉ nên dùng để tạo dữ liệu mẫu, kiểm thử form và demo quy trình; không dùng để thay thế phản hồi thật trong bài nộp hoặc báo cáo học thuật."
      },
      {
        question: "Sinh viên có thể dùng FormAuto Hub để làm gì?",
        answer:
          "Bạn có thể kiểm tra Google Form trước khi gửi khảo sát, thử dữ liệu mẫu trong Google Sheets và chuẩn bị demo cho bài thuyết trình."
      },
      {
        question: "Có cần xác nhận trước khi gửi phản hồi không?",
        answer: "Có. FormAuto Hub yêu cầu preview và người dùng xác nhận trước thao tác gửi."
      }
    ]
  },
  "google-forms/survey-demo": {
    slug: "google-forms/survey-demo",
    title: "Demo dữ liệu khảo sát Google Forms | FormAuto Hub",
    description:
      "Tạo bản xem trước dữ liệu khảo sát mẫu để demo form, bảng tính và dashboard trước khi có phản hồi thật.",
    eyebrow: "Demo dữ liệu khảo sát",
    h1: "Demo dữ liệu khảo sát trước khi chạy khảo sát thật",
    lead:
      "Dành cho nhóm sinh viên, câu lạc bộ hoặc lớp học cần trình bày form khảo sát, bảng dữ liệu và biểu đồ khi dữ liệu thật chưa sẵn sàng.",
    primaryKeyword: "demo dữ liệu khảo sát",
    secondaryKeywords: [
      "dữ liệu mẫu khảo sát",
      "xem trước phản hồi khảo sát",
      "demo Google Forms",
      "mẫu dữ liệu Google Forms"
    ],
    useCases: [
      "Minh họa dữ liệu khảo sát trong buổi thuyết trình",
      "Kiểm tra Google Sheets hoặc dashboard trước khi công bố form",
      "Giúp nhóm thống nhất cấu trúc câu hỏi trước khi thu thập thật"
    ],
    features: [
      {
        title: "Dữ liệu mẫu để trình bày",
        body: "Tạo dữ liệu preview đủ để nhìn thấy bảng, biểu đồ và các cột dữ liệu hoạt động ra sao."
      },
      {
        title: "Không thay dữ liệu thật",
        body: "Nội dung trang định vị rõ đây là dữ liệu mẫu để demo và kiểm thử, không phải dữ liệu khảo sát thật."
      },
      {
        title: "Rà soát theo nhóm",
        body: "Nhóm có thể xem preview, sửa rule và kiểm tra lại trước khi gửi form cho người trả lời thật."
      }
    ],
    faqs: [
      {
        question: "Demo dữ liệu khảo sát khác gì dữ liệu khảo sát thật?",
        answer:
          "Dữ liệu demo chỉ dùng để kiểm tra hoặc trình bày cách form, sheet và biểu đồ hoạt động. Kết luận báo cáo vẫn cần dữ liệu thật từ người trả lời hợp lệ."
      },
      {
        question: "Có thể dùng để chuẩn bị slide thuyết trình không?",
        answer: "Có, nếu bạn ghi rõ đó là dữ liệu mẫu hoặc dữ liệu minh họa."
      },
      {
        question: "FormAuto Hub có hỗ trợ spam form không?",
        answer: "Không. Spam, fake account, proxy rotation và captcha bypass đều bị cấm."
      }
    ]
  },
  "google-forms/sheets-report": {
    slug: "google-forms/sheets-report",
    title: "Google Forms to Sheets cho báo cáo | FormAuto Hub",
    description:
      "Kiểm tra dữ liệu Google Forms đổ về Google Sheets, thử biểu đồ và rà soát báo cáo trước khi khảo sát thật.",
    eyebrow: "Forms to Sheets",
    h1: "Kiểm tra Google Forms to Sheets trước khi làm báo cáo",
    lead:
      "FormAuto Hub giúp bạn tạo preview phản hồi mẫu để xem dữ liệu trong Google Sheets, kiểm tra cột, biểu đồ và báo cáo trước khi công bố form.",
    primaryKeyword: "google forms to sheets báo cáo",
    secondaryKeywords: [
      "kiểm tra biểu đồ Google Sheets",
      "Google Forms Google Sheets báo cáo",
      "dữ liệu khảo sát Google Sheets",
      "test Google Forms to Sheets"
    ],
    useCases: [
      "Kiểm tra dữ liệu có đổ đúng cột trong Google Sheets không",
      "Thử biểu đồ hoặc dashboard trước khi có phản hồi thật",
      "Rà soát workflow báo cáo của nhóm trước ngày thuyết trình"
    ],
    features: [
      {
        title: "Thử cấu trúc dữ liệu",
        body: "Preview phản hồi giúp bạn nhìn trước thứ tự cột, kiểu dữ liệu và các trường cần làm sạch."
      },
      {
        title: "Kiểm tra biểu đồ",
        body: "Dữ liệu mẫu giúp kiểm tra biểu đồ, pivot hoặc dashboard có đọc đúng dữ liệu Google Forms không."
      },
      {
        title: "Giảm lỗi trước deadline",
        body: "Nhóm có thể phát hiện lỗi câu hỏi, lựa chọn hoặc báo cáo trước khi gửi khảo sát thật."
      }
    ],
    faqs: [
      {
        question: "Trang này có thay thế Google Sheets không?",
        answer:
          "Không. FormAuto Hub hỗ trợ tạo preview dữ liệu mẫu; Google Sheets vẫn là nơi bạn xem bảng, biểu đồ hoặc báo cáo."
      },
      {
        question: "Có phù hợp cho bài báo cáo môn học không?",
        answer: "Có, khi dùng để kiểm thử form, kiểm tra sheet và demo quy trình trước khi thu thập dữ liệu thật."
      },
      {
        question: "Có nên dùng dữ liệu mẫu làm kết quả khảo sát cuối cùng không?",
        answer: "Không. Dữ liệu mẫu không nên được trình bày như dữ liệu thật."
      }
    ]
  },
  "google-forms/sample-data": {
    slug: "google-forms/sample-data",
    title: "Tạo dữ liệu mẫu cho Google Forms | FormAuto Hub",
    description:
      "Tạo dữ liệu phản hồi mẫu cho Google Forms để kiểm thử form, demo báo cáo và xem trước kết quả trước khi thu thập dữ liệu thật.",
    eyebrow: "Dữ liệu mẫu",
    h1: "Tạo dữ liệu mẫu cho Google Forms để kiểm thử và demo",
    lead:
      "FormAuto Hub giúp tạo preview dữ liệu mẫu trong phạm vi có kiểm soát, phù hợp để test form, demo dashboard và chuẩn bị báo cáo.",
    primaryKeyword: "tạo dữ liệu mẫu Google Forms",
    secondaryKeywords: [
      "sample data Google Forms",
      "dữ liệu mẫu Google Form",
      "xem trước phản hồi Google Form",
      "kiểm thử form khảo sát"
    ],
    useCases: [
      "Tạo dữ liệu mẫu để kiểm thử Google Form",
      "Demo bảng dữ liệu hoặc biểu đồ cho nhóm",
      "Rà soát câu trả lời trước khi xác nhận thao tác"
    ],
    features: [
      {
        title: "Sample data rõ mục đích",
        body: "Nội dung nhấn mạnh dữ liệu mẫu phục vụ test và demo, không thay thế dữ liệu khảo sát thật."
      },
      {
        title: "Preview trước khi gửi",
        body: "Người dùng phải xem trước phản hồi đã tạo và xác nhận trước khi tiếp tục."
      },
      {
        title: "Giới hạn và log",
        body: "Mỗi thao tác có giới hạn số lượng, trừ credit theo preview và ghi lịch sử sử dụng."
      }
    ],
    faqs: [
      {
        question: "Dữ liệu mẫu Google Forms dùng để làm gì?",
        answer:
          "Dữ liệu mẫu dùng để kiểm thử form, kiểm tra Google Sheets, demo dashboard hoặc chuẩn bị thuyết trình trước khi có dữ liệu thật."
      },
      {
        question: "Có thể tạo số lượng lớn không?",
        answer: "MVP giới hạn preview 1 đến 100 phản hồi mỗi thao tác và yêu cầu xác nhận trước khi gửi."
      },
      {
        question: "Có được dùng dữ liệu mẫu để giả làm kết quả khảo sát không?",
        answer: "Không. Đây là dữ liệu kiểm thử hoặc minh họa, không phải phản hồi thật từ người khảo sát."
      }
    ]
  },
  "anti-abuse": {
    slug: "anti-abuse",
    title: "Chính sách chống lạm dụng | FormAuto Hub",
    description:
      "FormAuto Hub chỉ hỗ trợ kiểm thử, dữ liệu mẫu và preview có kiểm soát; không hỗ trợ spam, fake survey data, captcha bypass hoặc proxy rotation.",
    eyebrow: "Anti-abuse",
    h1: "Chỉ dùng FormAuto Hub cho kiểm thử và dữ liệu mẫu hợp lệ",
    lead:
      "FormAuto Hub được thiết kế để giúp kiểm tra biểu mẫu, demo dữ liệu mẫu và rà soát quy trình. Sản phẩm không phục vụ gian lận khảo sát hoặc tạo dữ liệu giả để nộp như dữ liệu thật.",
    primaryKeyword: "chống lạm dụng Google Forms",
    secondaryKeywords: [
      "Google Forms automation không spam",
      "không làm giả khảo sát",
      "dữ liệu mẫu không thay dữ liệu thật",
      "form automation có kiểm soát"
    ],
    useCases: [
      "Dùng với biểu mẫu bạn sở hữu hoặc được phép kiểm thử",
      "Ghi rõ dữ liệu mẫu khi dùng trong demo hoặc slide",
      "Dừng lại nếu mục đích là làm giả phản hồi khảo sát"
    ],
    features: [
      {
        title: "Không hỗ trợ gian lận",
        body: "Không dùng FormAuto Hub để làm giả kết quả khảo sát, buff form, spam hoặc thay thế phản hồi thật."
      },
      {
        title: "Không né kiểm soát",
        body: "Không hỗ trợ captcha bypass, proxy rotation, fake account hoặc bypass Google restrictions."
      },
      {
        title: "Có giới hạn vận hành",
        body: "Preview, xác nhận, giới hạn số lượng, credit và usage logs giúp giữ quy trình trong phạm vi kiểm soát."
      }
    ],
    faqs: [
      {
        question: "Có được dùng FormAuto Hub để tạo dữ liệu nộp báo cáo không?",
        answer:
          "Không nếu bạn trình bày dữ liệu đó như phản hồi thật. FormAuto Hub chỉ hỗ trợ dữ liệu mẫu, demo và kiểm thử."
      },
      {
        question: "Có được dùng với form không thuộc quyền của mình không?",
        answer: "Không. Chỉ dùng với biểu mẫu bạn sở hữu hoặc được phép kiểm thử."
      },
      {
        question: "FormAuto Hub có bypass captcha hoặc tạo tài khoản giả không?",
        answer: "Không. Những hành vi này bị cấm theo product safety rules."
      }
    ]
  }
};

export const seoPageSlugs = Object.keys(seoPages) as SeoPageSlug[];

export function buildSeoMetadata(config: SeoPageConfig): Metadata {
  const url = `/${config.slug}`;

  return {
    title: {
      absolute: config.title
    },
    description: config.description,
    keywords: [config.primaryKeyword, ...config.secondaryKeywords, "FormAuto Hub"],
    alternates: {
      canonical: url
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: `${siteUrl}${url}`,
      siteName: "FormAuto Hub",
      locale: "vi_VN",
      type: "website",
      images: [
        {
          url: "/images/landing/login-screen.png",
          width: 1440,
          height: 1000,
          alt: "FormAuto Hub dashboard"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
      images: ["/images/landing/login-screen.png"]
    }
  };
}
