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
  contentSections: Array<{
    heading: string;
    body: string[];
  }>;
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
    title: "Tạo dữ liệu mẫu Google Forms cho báo cáo sinh viên | FormAuto Hub",
    description:
      "Tạo dữ liệu mẫu Google Forms cho báo cáo sinh viên, kiểm tra Google Sheets, biểu đồ và demo nhóm trước khi thu thập phản hồi thật.",
    eyebrow: "Báo cáo sinh viên",
    h1: "Tạo dữ liệu mẫu Google Forms cho báo cáo sinh viên",
    lead:
      "FormAuto Hub giúp sinh viên và nhóm học tập tạo dữ liệu mẫu cho Google Forms để kiểm tra form khảo sát, thử bảng dữ liệu, rà soát biểu đồ và chuẩn bị phần demo trước khi gửi khảo sát thật.",
    primaryKeyword: "dữ liệu mẫu Google Forms cho báo cáo sinh viên",
    secondaryKeywords: [
      "google forms báo cáo sinh viên",
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
    contentSections: [
      {
        heading: "Vì sao sinh viên cần dữ liệu mẫu Google Forms?",
        body: [
          "Khi làm báo cáo môn học hoặc khảo sát nhóm, biểu mẫu thường được tạo trước khi có đủ người trả lời thật. Nếu chờ đến lúc thu thập xong mới kiểm tra, nhóm dễ phát hiện muộn các lỗi như câu hỏi thiếu lựa chọn, dữ liệu đổ sai cột, biểu đồ không đọc đúng kiểu dữ liệu hoặc dashboard không đủ mẫu để minh họa.",
          "FormAuto Hub giúp tạo dữ liệu mẫu Google Forms trong giai đoạn chuẩn bị. Dữ liệu này phù hợp để kiểm thử cấu trúc form, kiểm tra Google Sheets và trình bày quy trình thu thập dữ liệu trong slide. Nội dung phải được ghi rõ là dữ liệu mẫu hoặc dữ liệu minh họa, không phải kết quả khảo sát thật."
        ]
      },
      {
        heading: "Quy trình phù hợp cho bài báo cáo nhóm",
        body: [
          "Nhóm có thể tạo Google Form, thêm URL vào FormAuto Hub, cấu hình quy tắc trả lời theo từng câu hỏi và xem trước phản hồi mẫu. Sau khi preview, nhóm kiểm tra lại dữ liệu đầu ra trong Google Sheets, biểu đồ và phần trình bày. Việc gửi hoặc sử dụng dữ liệu luôn cần sự xác nhận rõ ràng của người dùng.",
          "Cách làm này giúp nhóm thống nhất cấu trúc khảo sát trước ngày thuyết trình, đồng thời giảm rủi ro nhầm dữ liệu mẫu với phản hồi thật. Với báo cáo học thuật, kết luận cuối cùng vẫn cần dựa trên phản hồi hợp lệ từ người tham gia khảo sát."
        ]
      }
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
      "Demo dữ liệu khảo sát Google Forms bằng dữ liệu mẫu để trình bày form, bảng tính, biểu đồ và dashboard trước khi có phản hồi thật.",
    eyebrow: "Demo dữ liệu khảo sát",
    h1: "Demo dữ liệu khảo sát Google Forms bằng dữ liệu mẫu",
    lead:
      "Dành cho nhóm sinh viên, câu lạc bộ, lớp học hoặc team nhỏ cần trình bày form khảo sát, bảng dữ liệu và biểu đồ Google Sheets khi dữ liệu thật chưa sẵn sàng.",
    primaryKeyword: "demo dữ liệu khảo sát Google Forms",
    secondaryKeywords: [
      "demo dữ liệu khảo sát",
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
    contentSections: [
      {
        heading: "Demo khảo sát cần dữ liệu đủ giống thực tế",
        body: [
          "Một form khảo sát thường chỉ dễ đánh giá khi có dữ liệu mẫu đủ đa dạng. Nếu bảng Google Sheets trống, nhóm khó kiểm tra biểu đồ, tỷ lệ lựa chọn, cột dữ liệu và cách dashboard hiển thị. Dữ liệu demo giúp người xem hiểu form sẽ vận hành thế nào mà không cần chờ phản hồi thật.",
          "FormAuto Hub tập trung vào demo dữ liệu khảo sát có kiểm soát. Người dùng tạo bản xem trước, rà soát kết quả và chỉ dùng dữ liệu mẫu cho mục đích minh họa, kiểm thử hoặc chuẩn bị thuyết trình."
        ]
      },
      {
        heading: "Dùng demo đúng cách",
        body: [
          "Dữ liệu demo nên được tách khỏi dữ liệu khảo sát thật và được ghi chú rõ trong slide, báo cáo hoặc buổi trình bày. Điều này giúp tránh hiểu nhầm rằng dữ liệu mẫu là kết quả nghiên cứu cuối cùng.",
          "Trang này nhấn mạnh các trường hợp hợp lệ như prototype khảo sát, trình bày workflow, kiểm tra dashboard hoặc chuẩn bị bản mẫu cho giảng viên và team. FormAuto Hub không hỗ trợ spam form, thao túng khảo sát hoặc gửi phản hồi hàng loạt vào form không có quyền."
        ]
      }
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
    title: "Kiểm tra dữ liệu Google Forms trong Google Sheets | FormAuto Hub",
    description:
      "Kiểm tra dữ liệu Google Forms trong Google Sheets bằng dữ liệu mẫu để rà soát cột, kiểu dữ liệu, chart, dashboard và báo cáo.",
    eyebrow: "Forms to Sheets",
    h1: "Kiểm tra dữ liệu Google Forms trong Google Sheets bằng dữ liệu mẫu",
    lead:
      "FormAuto Hub giúp bạn tạo preview phản hồi mẫu để kiểm tra dữ liệu Google Forms trong Google Sheets, rà soát thứ tự cột, kiểu dữ liệu, biểu đồ và báo cáo trước khi công bố form.",
    primaryKeyword: "kiểm tra dữ liệu Google Forms trong Google Sheets",
    secondaryKeywords: [
      "google forms to sheets báo cáo",
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
    contentSections: [
      {
        heading: "Google Forms to Sheets dễ lỗi ở dữ liệu đầu ra",
        body: [
          "Khi Google Forms đổ dữ liệu về Google Sheets, chỉ một câu hỏi sai kiểu hoặc đổi thứ tự cũng có thể làm biểu đồ, công thức, filter hoặc pivot table hoạt động không như mong muốn. Những lỗi này thường khó thấy nếu bảng chưa có dữ liệu mẫu để kiểm tra.",
          "FormAuto Hub giúp tạo phản hồi mẫu có kiểm soát để người dùng xem trước dữ liệu đầu ra. Nhóm có thể kiểm tra cột, định dạng ngày giờ, lựa chọn nhiều đáp án, câu trả lời văn bản và cách các biểu đồ đọc dữ liệu."
        ]
      },
      {
        heading: "Chuẩn bị báo cáo trước khi có phản hồi thật",
        body: [
          "Dữ liệu mẫu hỗ trợ dựng dashboard, thử chart và rà soát phần báo cáo trước deadline. Khi phản hồi thật bắt đầu về, nhóm đã có sẵn cấu trúc sheet, biểu đồ và quy trình kiểm tra rõ ràng.",
          "Dữ liệu tạo ra trong giai đoạn này chỉ nên dùng cho kiểm thử hoặc minh họa. Nếu báo cáo yêu cầu kết luận từ khảo sát thực tế, dữ liệu thật từ người trả lời hợp lệ vẫn là nguồn bắt buộc."
        ]
      }
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
    title: "Tạo dữ liệu mẫu cho Google Forms để kiểm thử và demo | FormAuto Hub",
    description:
      "FormAuto Hub giúp tạo dữ liệu mẫu cho Google Forms để kiểm thử biểu mẫu, xem trước phản hồi, demo Google Sheets và chuẩn bị báo cáo an toàn.",
    eyebrow: "Dữ liệu mẫu",
    h1: "Tạo dữ liệu mẫu cho Google Forms để kiểm thử và demo",
    lead:
      "FormAuto Hub giúp bạn tạo dữ liệu mẫu cho Google Forms để kiểm thử biểu mẫu, xem trước phản hồi, demo báo cáo Google Sheets và chuẩn bị dữ liệu minh họa trước khi có phản hồi thật.",
    primaryKeyword: "tạo dữ liệu mẫu cho Google Forms",
    secondaryKeywords: [
      "tạo dữ liệu mẫu Google Forms",
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
    contentSections: [
      {
        heading: "Khi nào nên tạo dữ liệu mẫu cho Google Forms?",
        body: [
          "Nhiều người tạo Google Forms cần kiểm tra biểu mẫu trước khi gửi thật: câu hỏi có đúng logic không, dữ liệu có đổ về Google Sheets đúng cột không, biểu đồ có hiển thị hợp lý không, và báo cáo demo có đủ dữ liệu minh họa không. Nếu chờ đến khi có phản hồi thật mới kiểm tra, lỗi thường xuất hiện muộn và khó sửa.",
          "FormAuto Hub giúp tạo dữ liệu mẫu cho Google Forms trong quy trình kiểm thử. Bạn có thể xem trước phản hồi mẫu, kiểm tra dữ liệu đầu ra và dùng cho mục đích demo, học tập hoặc kiểm thử hợp lệ."
        ]
      },
      {
        heading: "FormAuto Hub giúp gì cho quá trình kiểm thử biểu mẫu?",
        body: [
          "Ứng dụng hỗ trợ phân tích Google Form, nhận diện câu hỏi, cấu hình quy tắc trả lời và tạo bản xem trước phản hồi. Người dùng kiểm tra preview trước khi xác nhận bước tiếp theo, nhờ đó dữ liệu mẫu không được tạo hoặc dùng một cách mù mờ.",
          "Các thao tác quan trọng được gắn với credit và lịch sử sử dụng, giúp nhóm biết đã tạo dữ liệu mẫu khi nào, dùng bao nhiêu credit và mục đích kiểm thử là gì. Đây là điểm quan trọng để phân biệt workflow kiểm thử hợp lệ với hành vi spam hoặc thao túng khảo sát."
        ]
      },
      {
        heading: "Ví dụ dữ liệu mẫu có thể dùng để làm gì?",
        body: [
          "Dữ liệu mẫu có thể dùng để demo dashboard Google Sheets, kiểm tra biểu đồ trong bài thuyết trình, thử cấu trúc bảng trước khi thu thập dữ liệu thật hoặc minh họa quy trình khảo sát cho nhóm. Với sinh viên, dữ liệu mẫu hữu ích trong giai đoạn chuẩn bị báo cáo, nhưng không được trình bày như kết quả khảo sát thật.",
          "FormAuto Hub không hỗ trợ vượt captcha, xoay proxy, tạo tài khoản giả, spam form hoặc gửi phản hồi vào biểu mẫu không có quyền. Mục tiêu của sản phẩm là kiểm thử, demo và chuẩn bị báo cáo an toàn."
        ]
      }
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
    contentSections: [
      {
        heading: "Ranh giới giữa kiểm thử và lạm dụng",
        body: [
          "FormAuto Hub được thiết kế cho các trường hợp hợp lệ: kiểm thử biểu mẫu, tạo dữ liệu mẫu, demo Google Sheets và chuẩn bị báo cáo. Những hành vi như spam, buff form, làm giả kết quả khảo sát, vượt captcha hoặc gửi phản hồi vào form không có quyền đều nằm ngoài phạm vi sản phẩm.",
          "Trang chống lạm dụng giúp Google, AI search và người dùng hiểu rõ định vị an toàn của FormAuto Hub. Dữ liệu mẫu phải được sử dụng minh bạch và không được thay thế phản hồi thật trong khảo sát, nghiên cứu hoặc báo cáo học thuật."
        ]
      },
      {
        heading: "Các nguyên tắc vận hành an toàn",
        body: [
          "Người dùng cần xem trước phản hồi, xác nhận thao tác và chỉ dùng với biểu mẫu mình sở hữu hoặc được phép kiểm thử. Hệ thống giới hạn số lượng phản hồi xem trước, ghi nhận credit và lưu lịch sử sử dụng để tăng khả năng truy vết.",
          "Nếu mục tiêu là né giới hạn của Google, tạo dữ liệu giả để nộp như kết quả thật hoặc tác động tới biểu mẫu của người khác, FormAuto Hub không phải công cụ phù hợp."
        ]
      }
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
