import type { AiDirectionFields, GenerationMode } from "./_types";

export const modeOptions = [
  { value: "SampleTextLines", label: "Dòng mẫu" },
  { value: "DateRangeSequential", label: "Khoảng ngày tuần tự" },
  { value: "TimeRangeSequential", label: "Khoảng giờ tuần tự" },
  { value: "RandomEqually", label: "Chia đều ngẫu nhiên" },
  { value: "RandomByPercentage", label: "Theo tỷ lệ" },
  { value: "RandomByQuantity", label: "Theo số lượng" }
];

export const FORM_URL_MAX_LENGTH = 2048;
export const PROJECT_NAME_MAX_LENGTH = 120;
export const PREVIEW_COUNT_MIN = 1;
export const PREVIEW_COUNT_MAX = 100;
export const SUBMISSION_BATCH_SIZE = 10;
export const MAX_RULE_VALUES = 10;
export const PERCENTAGE_TOTAL = 100;
export const MAX_SAMPLE_LINES = 100;
export const MAX_SAMPLE_LENGTH = 500;
export const TIME_STEP_MIN = 5;
export const TIME_STEP_MAX = 120;
export const CHECKBOX_SELECTION_MIN = 1;
export const FORM_PREVIEW_RESUME_KEY = "formauto.formPreviewResume";
export const FORM_PREVIEW_RESUME_CHANNEL = "formauto.formPreviewResume";
export const AI_SHORT_FIELD_MAX_LENGTH = 200;
export const AI_GLOBAL_PROMPT_MAX_LENGTH = 2000;
export const AI_QUESTION_PROMPT_MAX_LENGTH = 1000;
export const DEFAULT_AI_GLOBAL_PROMPT = "Tạo câu trả lời tự nhiên, ngắn gọn và phù hợp với câu hỏi trong biểu mẫu.";

export const defaultAiDirection: AiDirectionFields = {
  targetAge: "",
  role: "",
  context: "",
  tone: "Thân thiện",
  answerLength: "Ngắn",
  intent: ""
};

export const generationModeOptions: Array<{
  value: GenerationMode;
  title: string;
  description: string;
  badge: string;
}> = [
  {
    value: "rules",
    title: "Option 1",
    description: "Quy tắc hiện tại",
    badge: "x1"
  },
  {
    value: "ai-default",
    title: "Option 2",
    description: "AI mặc định",
    badge: "x2"
  },
  {
    value: "ai-custom",
    title: "Option 3",
    description: "AI tùy chỉnh",
    badge: "x3"
  }
];
