import type { AiDirectionFields, AiGenerationMode, FormPreviewResumeContext } from "./_types";
import {
  AI_SHORT_FIELD_MAX_LENGTH,
  CHECKBOX_SELECTION_MIN,
  FORM_PREVIEW_RESUME_KEY,
  MAX_RULE_VALUES,
  MAX_SAMPLE_LENGTH,
  MAX_SAMPLE_LINES,
  PERCENTAGE_TOTAL,
  SUBMISSION_BATCH_SIZE,
  TIME_STEP_MIN,
  TIME_STEP_MAX,
  defaultAiDirection
} from "./_constants";
import type { CreditPackage, FormQuestion, SubmissionJob } from "@/lib/api";

export function toBackendAiMode(mode: AiGenerationMode) {
  return mode === "ai-custom" ? "Option3" : "Option2";
}

export function buildAiAudienceJson(mode: AiGenerationMode, direction: AiDirectionFields) {
  if (mode === "ai-default") {
    return JSON.stringify({});
  }

  return JSON.stringify({
    targetAge: direction.targetAge,
    role: direction.role,
    context: direction.context,
    tone: direction.tone,
    answerLength: direction.answerLength,
    intent: direction.intent
  });
}

export function readAiDirection(audienceJson: string): AiDirectionFields {
  try {
    const parsed = JSON.parse(audienceJson) as Partial<AiDirectionFields>;
    return {
      targetAge: limitText(String(parsed.targetAge ?? ""), AI_SHORT_FIELD_MAX_LENGTH),
      role: limitText(String(parsed.role ?? ""), AI_SHORT_FIELD_MAX_LENGTH),
      context: limitText(String(parsed.context ?? ""), AI_SHORT_FIELD_MAX_LENGTH),
      tone: limitText(String(parsed.tone ?? defaultAiDirection.tone), AI_SHORT_FIELD_MAX_LENGTH),
      answerLength: limitText(String(parsed.answerLength ?? defaultAiDirection.answerLength), AI_SHORT_FIELD_MAX_LENGTH),
      intent: limitText(String(parsed.intent ?? ""), AI_SHORT_FIELD_MAX_LENGTH)
    };
  } catch {
    return defaultAiDirection;
  }
}

export function buildAiAutoFillContext(mode: AiGenerationMode, direction: AiDirectionFields) {
  if (mode === "ai-default") {
    return "";
  }

  return limitText(
    [
      direction.targetAge && `Độ tuổi: ${direction.targetAge}`,
      direction.role && `Vai trò: ${direction.role}`,
      direction.context && `Ngữ cảnh: ${direction.context}`,
      direction.tone && `Giọng văn: ${direction.tone}`,
      direction.answerLength && `Độ dài: ${direction.answerLength}`,
      direction.intent && `Ý định: ${direction.intent}`
    ].filter(Boolean).join("; "),
    AI_SHORT_FIELD_MAX_LENGTH
  );
}

export function defaultRule(question: FormQuestion) {
  if (isFreeTextRuleQuestion(question.questionType)) {
    return {
      mode: "SampleTextLines",
      configJson: JSON.stringify({ samples: defaultSamplesForQuestion(question) }, null, 2)
    };
  }

  const values = question.options.length > 0 ? question.options : ["Lựa chọn A", "Lựa chọn B"];
  return {
    mode: "RandomEqually",
    configJson: buildChoiceConfig("RandomEqually", values, question.questionType)
  };
}

export function defaultConfigForMode(
  mode: string,
  question: FormQuestion,
  values: string[],
  currentSamples: string[],
  checkboxSelection: { minSelections: number; maxSelections: number }
) {
  if (mode === "DateRangeSequential") {
    return JSON.stringify({ fromDate: "2026-05-18", toDate: "2026-05-25" }, null, 2);
  }

  if (mode === "TimeRangeSequential") {
    return JSON.stringify({ fromTime: "09:00", toTime: "17:00", stepMinutes: 60 }, null, 2);
  }

  if (mode === "SampleTextLines") {
    return JSON.stringify({ samples: currentSamples.length > 0 ? currentSamples : defaultSamplesForQuestion(question) }, null, 2);
  }

  return buildChoiceConfig(mode, values, question.questionType, checkboxSelection);
}

export function defaultSamplesForQuestion(question: FormQuestion) {
  if (question.questionType === "Date") {
    return ["2026-05-18"];
  }

  if (question.questionType === "Time") {
    return ["09:00"];
  }

  return ["Câu trả lời mẫu 1", "Câu trả lời mẫu 2"];
}

export function buildChoiceConfig(
  mode: string,
  values: string[],
  questionType?: string,
  checkboxSelection: { minSelections: number; maxSelections: number } = { minSelections: 1, maxSelections: 1 }
) {
  const normalized = values.map((value) => value.trim()).filter(Boolean);
  const limited = normalized.slice(0, MAX_RULE_VALUES);
  const selection = questionType === "Checkbox"
    ? clampCheckboxSelection(checkboxSelection, Math.max(1, limited.length))
    : null;
  if (mode === "RandomByPercentage") {
    const percentages = buildEqualPercentages(limited);
    return JSON.stringify(
      {
        weights: percentages,
        ...(selection ?? {})
      },
      null,
      2
    );
  }

  if (mode === "RandomByQuantity") {
    return JSON.stringify(
      {
        quantities: Object.fromEntries(limited.map((value) => [value, 1])),
        ...(selection ?? {})
      },
      null,
      2
    );
  }

  return JSON.stringify({ values: normalized, ...(selection ?? {}) }, null, 2);
}

export function buildEqualPercentages(values: string[]) {
  if (values.length === 0) {
    return {};
  }

  const base = Math.floor(PERCENTAGE_TOTAL / values.length);
  let remainder = PERCENTAGE_TOTAL - base * values.length;
  return Object.fromEntries(
    values.map((value) => {
      const amount = base + (remainder > 0 ? 1 : 0);
      remainder -= 1;
      return [value, amount];
    })
  );
}

export function buildChoiceNumberConfig(
  propertyName: "weights" | "quantities",
  activeOptions: string[],
  values: Record<string, number>,
  questionType: string,
  checkboxSelection: { minSelections: number; maxSelections: number }
) {
  const selection = questionType === "Checkbox"
    ? clampCheckboxSelection(checkboxSelection, Math.max(1, activeOptions.length))
    : null;

  return JSON.stringify(
    {
      [propertyName]: Object.fromEntries(activeOptions.map((key) => [key, values[key]])),
      ...(selection ?? {})
    },
    null,
    2
  );
}

export function mergeCheckboxSelection(
  configJson: string,
  mode: string,
  values: string[],
  selection: { minSelections: number; maxSelections: number }
) {
  try {
    const parsed = JSON.parse(configJson) as {
      values?: string[];
      weights?: Record<string, number>;
      quantities?: Record<string, number>;
    };
    if (mode === "RandomByPercentage" && parsed.weights) {
      return JSON.stringify({ weights: parsed.weights, ...selection }, null, 2);
    }
    if (mode === "RandomByQuantity" && parsed.quantities) {
      return JSON.stringify({ quantities: parsed.quantities, ...selection }, null, 2);
    }
    return JSON.stringify({ values: parsed.values ?? values, ...selection }, null, 2);
  } catch {
    return JSON.stringify({ values, ...selection }, null, 2);
  }
}

export function readSamples(configJson: string) {
  try {
    const parsed = JSON.parse(configJson) as { samples?: string[] };
    return Array.isArray(parsed.samples) ? parsed.samples : [];
  } catch {
    return [];
  }
}

export function readDateRange(configJson: string) {
  try {
    const parsed = JSON.parse(configJson) as { fromDate?: string; toDate?: string };
    return {
      fromDate: typeof parsed.fromDate === "string" ? parsed.fromDate : "",
      toDate: typeof parsed.toDate === "string" ? parsed.toDate : ""
    };
  } catch {
    return { fromDate: "", toDate: "" };
  }
}

export function readTimeRange(configJson: string) {
  try {
    const parsed = JSON.parse(configJson) as { fromTime?: string; toTime?: string; stepMinutes?: number };
    return {
      fromTime: typeof parsed.fromTime === "string" ? parsed.fromTime : "",
      toTime: typeof parsed.toTime === "string" ? parsed.toTime : "",
      stepMinutes: typeof parsed.stepMinutes === "number" && Number.isFinite(parsed.stepMinutes) ? parsed.stepMinutes : ""
    };
  } catch {
    return { fromTime: "", toTime: "", stepMinutes: "" };
  }
}

// Mirror existing range constraints only; defaults are written by defaultConfigForMode.
export function rangeRuleError(mode: string, configJson: string): string | null {
  if (mode !== "DateRangeSequential" && mode !== "TimeRangeSequential") return null;
  try {
    const parsed = JSON.parse(configJson);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return "Hãy nhập đầy đủ khoảng ngày hoặc giờ.";
    if (mode === "DateRangeSequential") {
      const validDate = (value: unknown): value is string => {
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
        const date = new Date(`${value}T00:00:00Z`);
        return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
      };
      if (!validDate(parsed.fromDate) || !validDate(parsed.toDate)) return "Nhập đầy đủ ngày bắt đầu và ngày kết thúc hợp lệ.";
      return parsed.fromDate > parsed.toDate ? "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc." : null;
    }
    const validTime = (value: unknown): value is string => typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
    if (!validTime(parsed.fromTime) || !validTime(parsed.toTime)) return "Nhập đầy đủ giờ bắt đầu và giờ kết thúc hợp lệ.";
    if (parsed.fromTime > parsed.toTime) return "Giờ bắt đầu phải trước hoặc bằng giờ kết thúc.";
    return !Number.isInteger(parsed.stepMinutes) || parsed.stepMinutes < TIME_STEP_MIN || parsed.stepMinutes > TIME_STEP_MAX
      ? `Bước thời gian phải là số nguyên từ ${TIME_STEP_MIN} đến ${TIME_STEP_MAX} phút.` : null;
  } catch {
    return "Hãy nhập đầy đủ khoảng ngày hoặc giờ hợp lệ.";
  }
}

const safeAiFailureMessages = new Set([
  "Dịch vụ AI đã hết thời gian chờ. Vui lòng thử lại sau. Không trừ credit.",
  "Không kết nối được với dịch vụ AI. Vui lòng thử lại sau. Không trừ credit.",
  "Nội dung trả lời của AI không đúng định dạng. Kiểm tra hướng dẫn tạo câu trả lời. Không trừ credit.",
  "Phản hồi từ dịch vụ AI không đọc được. Vui lòng thử lại sau. Không trừ credit.",
  "Nhập hướng dẫn tạo câu trả lời AI trước khi tiếp tục. Không trừ credit.",
  "Hướng dẫn tạo câu trả lời không đáp ứng quy tắc an toàn. Vui lòng chỉnh sửa hướng dẫn. Không trừ credit.",
  "Không đủ credit để tạo hoặc lưu bản xem trước AI. Vui lòng kiểm tra số dư. Không trừ credit.",
  "AI chưa tạo được phản hồi xem trước hợp lệ. Kiểm tra hướng dẫn và cấu hình câu hỏi. Không trừ credit.",
  "Dịch vụ AI không chấp nhận cấu hình xác thực. Liên hệ quản trị viên kiểm tra cấu hình. Không trừ credit.",
  "Dịch vụ AI từ chối quyền truy cập. Liên hệ quản trị viên kiểm tra quyền. Không trừ credit.",
  "Dịch vụ AI đang giới hạn yêu cầu. Vui lòng chờ rồi thử lại. Không trừ credit.",
  "Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau. Không trừ credit.",
  "Dịch vụ AI từ chối yêu cầu. Liên hệ quản trị viên kiểm tra cấu hình. Không trừ credit."
]);

export function safeAiFailureMessage(message: string | null | undefined) {
  return message && safeAiFailureMessages.has(message) ? message : "Không tạo được bản xem trước AI. Nếu lỗi tiếp diễn, vui lòng liên hệ quản trị viên.";
}

export const uncertainSubmissionMessage = "Kết quả gửi chưa xác định. Không tự động gửi lại; hãy kiểm tra kết quả trên Google Forms.";

export function submissionFailureMessage(message: string | null | undefined) {
  if (message === uncertainSubmissionMessage) return uncertainSubmissionMessage;
  if (message === "Lượt gửi chưa thực hiện vì không ghi nhận được lần gửi trước khi gọi Google Forms.") return message;
  if (message === "Invalid form action URL.") return "Địa chỉ gửi của biểu mẫu không hợp lệ. Hãy kiểm tra lại biểu mẫu.";
  const status = /^Google Form returned HTTP ([45]\d{2})\.$/.exec(message ?? "")?.[1];
  if (status) return `Google Forms trả về lỗi ${status}. Hãy kiểm tra quyền truy cập và kết quả trên biểu mẫu trước khi gửi thêm.`;
  return "Không xác định được nguyên nhân lỗi từ nhật ký này. Hãy kiểm tra kết quả trên Google Forms trước khi gửi thêm.";
}

export function readChoiceValues(question: FormQuestion, configJson: string) {
  try {
    const parsed = JSON.parse(configJson) as {
      values?: string[];
      weights?: Record<string, number>;
      quantities?: Record<string, number>;
    };
    if (Array.isArray(parsed.values)) {
      return parsed.values;
    }
    if (parsed.weights) {
      return Object.keys(parsed.weights);
    }
    if (parsed.quantities) {
      return Object.keys(parsed.quantities);
    }
  } catch {
    // Use form options below.
  }

  return question.options;
}

export function readChoiceNumbers(mode: string, configJson: string, fallbackOptions: string[]) {
  const maxValue = mode === "RandomByPercentage" ? PERCENTAGE_TOTAL : MAX_RULE_VALUES;
  try {
    const parsed = JSON.parse(configJson) as {
      weights?: Record<string, number>;
      quantities?: Record<string, number>;
    };
    const source = mode === "RandomByPercentage" ? parsed.weights : parsed.quantities;
    if (source) {
      return Object.fromEntries(
        Object.entries(source).map(([key, amount]) => [key, clampInteger(amount, 0, maxValue)])
      );
    }
  } catch {
    // Use fallback below.
  }

  return mode === "RandomByPercentage"
    ? buildEqualPercentages(fallbackOptions)
    : Object.fromEntries(fallbackOptions.map((option) => [option, 1]));
}

export function readCheckboxSelection(configJson: string) {
  try {
    const parsed = JSON.parse(configJson) as { minSelections?: number; maxSelections?: number };
    return clampCheckboxSelection(
      {
        minSelections: parsed.minSelections ?? 1,
        maxSelections: parsed.maxSelections ?? 1
      },
      MAX_RULE_VALUES
    );
  } catch {
    return { minSelections: 1, maxSelections: 1 };
  }
}

export function clampCheckboxSelection(value: { minSelections: number; maxSelections: number }, optionCount: number) {
  const maxAllowed = Math.min(Math.max(1, optionCount), MAX_RULE_VALUES);
  const minSelections = clampInteger(value.minSelections, CHECKBOX_SELECTION_MIN, maxAllowed);
  const maxSelections = clampInteger(value.maxSelections, minSelections, maxAllowed);
  return { minSelections, maxSelections };
}

export function clampInteger(value: string | number, min: number, max: number) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.trunc(numericValue)));
}

export function limitText(value: string, maxLength: number) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

export function selectRecommendedPackage(packages: CreditPackage[], missingCredits: number) {
  return packages
    .filter((item) => item.isActive && item.credits >= missingCredits)
    .sort((left, right) => left.credits - right.credits || left.price - right.price)[0] ?? null;
}

export function saveResumeContext(context: FormPreviewResumeContext) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FORM_PREVIEW_RESUME_KEY, JSON.stringify(context));
}

export function readResumeContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(FORM_PREVIEW_RESUME_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as FormPreviewResumeContext;
  } catch {
    clearResumeContext();
    return null;
  }
}

export function clearResumeContext() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(FORM_PREVIEW_RESUME_KEY);
}

export function buildSubmissionBatches(logs: SubmissionJob["logs"]) {
  const batches: Array<SubmissionJob["logs"]> = [];
  for (let index = 0; index < logs.length; index += SUBMISSION_BATCH_SIZE) {
    batches.push(logs.slice(index, index + SUBMISSION_BATCH_SIZE));
  }

  return batches;
}

export function questionTypeLabel(type: string) {
  switch (type) {
    case "MultipleChoice":
      return "Trắc nghiệm";
    case "Checkbox":
      return "Ô chọn";
    case "Dropdown":
      return "Danh sách chọn";
    case "LinearScale":
      return "Thang điểm";
    case "Rating":
      return "Xếp hạng";
    case "MultipleChoiceGrid":
      return "Lưới trắc nghiệm";
    case "CheckboxGrid":
      return "Lưới ô chọn";
    case "Date":
      return "Ngày";
    case "Time":
      return "Giờ";
    case "ParagraphText":
      return "Đoạn văn";
    case "ShortText":
      return "Trả lời ngắn";
    default:
      return type;
  }
}

export function isFreeTextRuleQuestion(type: string) {
  return type === "ShortText" || type === "ParagraphText" || type === "Date" || type === "Time";
}

export function isFreeTextAiQuestion(type: string) {
  return type === "ShortText" || type === "ParagraphText";
}
