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
      fromDate: parsed.fromDate || "2026-05-18",
      toDate: parsed.toDate || "2026-05-25"
    };
  } catch {
    return { fromDate: "2026-05-18", toDate: "2026-05-25" };
  }
}

export function readTimeRange(configJson: string) {
  try {
    const parsed = JSON.parse(configJson) as { fromTime?: string; toTime?: string; stepMinutes?: number };
    return {
      fromTime: parsed.fromTime || "09:00",
      toTime: parsed.toTime || "17:00",
      stepMinutes: clampInteger(parsed.stepMinutes ?? 60, TIME_STEP_MIN, TIME_STEP_MAX)
    };
  } catch {
    return { fromTime: "09:00", toTime: "17:00", stepMinutes: 60 };
  }
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
