import { Bot, ChevronDown, ChevronUp } from "lucide-react";
import { Badge, Textarea } from "@/components/ui";
import type { AiGenerationMode } from "../_types";
import { AI_QUESTION_PROMPT_MAX_LENGTH } from "../_constants";
import { isFreeTextAiQuestion, questionTypeLabel } from "../_helpers";
import type { FormQuestion } from "@/lib/api";

export function AiQuestionBlock({
  index,
  mode,
  question,
  open,
  prompt,
  promptEnabled,
  onPromptChange,
  onToggle
}: {
  index: number;
  mode: AiGenerationMode;
  question: FormQuestion;
  open: boolean;
  prompt: string;
  promptEnabled: boolean;
  onPromptChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className={`overflow-hidden rounded-lg border bg-white/72 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md ${
      mode === "ai-custom" ? "border-violet-100 hover:border-violet-200" : "border-cyan-100 hover:border-cyan-200"
    }`}>
      <button
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        type="button"
        onClick={onToggle}
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
          mode === "ai-custom" ? "bg-violet-50 text-violet-700" : "bg-cyan-50 text-cyan-700"
        }`}>
          <Bot className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="break-words text-sm font-semibold">Câu {index + 1}: {question.label}</span>
            <Badge tone="info">AI</Badge>
            <Badge>{questionTypeLabel(question.questionType)}</Badge>
            {question.required && <Badge tone="warning">Bắt buộc</Badge>}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Khối AI thu gọn; không hiển thị danh sách lựa chọn chi tiết trong Option 2/3.
          </span>
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-white/80 text-muted-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {open && (
        <div className="border-t border-border/70 bg-white/45 p-4">
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Loại câu hỏi</p>
              <p className="mt-1 font-medium">{questionTypeLabel(question.questionType)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entry ID</p>
              <p className="mt-1 break-all font-medium">{question.entryId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nguồn đáp án</p>
              <p className="mt-1 font-medium">{isFreeTextAiQuestion(question.questionType) ? "Văn bản tự do" : "Lựa chọn gốc"}</p>
            </div>
          </div>
          {promptEnabled && (
            <label className="mt-4 block text-sm font-medium">
              Prompt riêng cho câu này
              <Textarea
                className="mt-2 min-h-24"
                maxLength={AI_QUESTION_PROMPT_MAX_LENGTH}
                value={prompt}
                onChange={(event) => onPromptChange(event.target.value)}
              />
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                {prompt.length}/{AI_QUESTION_PROMPT_MAX_LENGTH} ký tự
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
