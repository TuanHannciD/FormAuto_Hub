import { Sparkles, Wand2 } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import type { AiDirectionFields, AiGenerationMode, AiPromptScope } from "../_types";
import {
  AI_GLOBAL_PROMPT_MAX_LENGTH,
  PREVIEW_COUNT_MAX,
  PREVIEW_COUNT_MIN
} from "../_constants";
import { clampInteger } from "../_helpers";
import type { FormQuestion } from "@/lib/api";
import { AiDirectionInput } from "./AiDirectionInput";
import { AiQuestionBlock } from "./AiQuestionBlock";
export function AiModePreparationPanel({
  mode,
  questions,
  aiDirection,
  aiGlobalPrompt,
  aiPromptScope,
  aiQuestionBlocksOpen,
  aiQuestionPrompts,
  previewCount,
  multiplier,
  balance,
  busy,
  canGenerate,
  onDirectionChange,
  onGlobalPromptChange,
  onPromptScopeChange,
  onQuestionPromptChange,
  onToggleQuestion,
  onPreviewCountChange,
  onAutoFill,
  onGenerate
}: {
  mode: AiGenerationMode;
  questions: FormQuestion[];
  aiDirection: AiDirectionFields;
  aiGlobalPrompt: string;
  aiPromptScope: AiPromptScope;
  aiQuestionBlocksOpen: Record<string, boolean>;
  aiQuestionPrompts: Record<string, string>;
  previewCount: number;
  multiplier: number;
  balance: number | null;
  busy: boolean;
  canGenerate: boolean;
  onDirectionChange: (key: keyof AiDirectionFields, value: string) => void;
  onGlobalPromptChange: (value: string) => void;
  onPromptScopeChange: (value: AiPromptScope) => void;
  onQuestionPromptChange: (questionId: string, value: string) => void;
  onToggleQuestion: (questionId: string) => void;
  onPreviewCountChange: (value: number) => void;
  onAutoFill: () => void;
  onGenerate: () => void;
}) {
  const isCustom = mode === "ai-custom";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Miễn phí điền gợi ý; lưu hướng dẫn khi tạo bản xem trước.</p>
        <Button className="w-full gap-2 sm:w-auto" disabled={busy} type="button" variant="secondary" onClick={onAutoFill}>
          <Wand2 aria-hidden="true" className="h-4 w-4" />Điền gợi ý hướng dẫn
        </Button>
      </div>

      {isCustom && (
        <div className="rounded-xl border border-primary-border bg-surface p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Hướng trả lời AI</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <AiDirectionInput label="Độ tuổi mục tiêu" value={aiDirection.targetAge} onChange={(value) => onDirectionChange("targetAge", value)} />
            <AiDirectionInput label="Vai trò/nghề nghiệp" value={aiDirection.role} onChange={(value) => onDirectionChange("role", value)} />
            <AiDirectionInput label="Ngữ cảnh" value={aiDirection.context} onChange={(value) => onDirectionChange("context", value)} />
            <AiDirectionInput label="Giọng văn" value={aiDirection.tone} onChange={(value) => onDirectionChange("tone", value)} />
            <AiDirectionInput label="Độ dài câu trả lời" value={aiDirection.answerLength} onChange={(value) => onDirectionChange("answerLength", value)} />
            <AiDirectionInput label="Ý định trả lời" value={aiDirection.intent} onChange={(value) => onDirectionChange("intent", value)} />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <label className="block flex-1 text-sm font-medium">
            Hướng dẫn chung
            <Textarea
              className="mt-2 min-h-28"
              maxLength={AI_GLOBAL_PROMPT_MAX_LENGTH}
              value={aiGlobalPrompt}
              onChange={(event) => onGlobalPromptChange(event.target.value)}
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              {aiGlobalPrompt.length}/{AI_GLOBAL_PROMPT_MAX_LENGTH} ký tự
            </span>
          </label>
          {isCustom && (
            <div className="grid shrink-0 grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-2 text-sm font-semibold md:w-64">
              <button
                className={`rounded-xl px-3 py-2 transition ${aiPromptScope === "global" ? "bg-primary text-inverse-foreground shadow-sm" : "text-muted-foreground hover:bg-primary-soft"}`}
                type="button"
                onClick={() => onPromptScopeChange("global")}
              >
                Hướng dẫn chung
              </button>
              <button
                className={`rounded-xl px-3 py-2 transition ${aiPromptScope === "per-question" ? "bg-primary text-inverse-foreground shadow-sm" : "text-muted-foreground hover:bg-primary-soft"}`}
                type="button"
                onClick={() => onPromptScopeChange("per-question")}
              >
                Từng câu
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((question, index) => (
          <AiQuestionBlock
            key={question.id}
            index={index}
            mode={mode}
            open={aiQuestionBlocksOpen[question.id] ?? false}
            prompt={aiQuestionPrompts[question.id] ?? ""}
            promptEnabled={isCustom && aiPromptScope === "per-question"}
            question={question}
            onPromptChange={(value) => onQuestionPromptChange(question.id, value)}
            onToggle={() => onToggleQuestion(question.id)}
          />
        ))}
      </div>

      <div role="region" aria-label="Tạo bản xem trước AI" className={`sticky bottom-3 z-[200] flex flex-col gap-4 rounded-xl border p-4 shadow-soft ring-1 sm:flex-row sm:items-end sm:justify-between ${
        isCustom
          ? "border-primary-border/80 bg-primary-soft ring-primary-border"
          : "border-info-border bg-info-surface ring-info-border"
      }`}>
        <div className="w-full sm:w-auto">
          <label htmlFor="ai-preview-count" className="block text-sm font-semibold text-foreground">Số bản muốn tạo</label>
          <p id="ai-count-help" className="mt-1 text-xs text-secondary-foreground">1–{PREVIEW_COUNT_MAX} bản · Xem lại và xác nhận trước khi gửi.</p>
          <Input
            id="ai-preview-count"
            aria-describedby="ai-count-help ai-cost"
            className="mt-2 w-full sm:w-32"
            inputMode="numeric"
            max={PREVIEW_COUNT_MAX}
            min={PREVIEW_COUNT_MIN}
            step={1}
            type="number"
            value={previewCount}
            onChange={(event) => onPreviewCountChange(clampInteger(event.target.value, PREVIEW_COUNT_MIN, PREVIEW_COUNT_MAX))}
          />
          <p id="ai-cost" className="mt-2 text-xs font-medium text-info">Phí tạo dự kiến: {previewCount * multiplier} credit · {balance === null ? "Chưa tải được số dư" : `${balance} credit khả dụng`}. Chỉ trừ bản tạo hợp lệ đã lưu. Phí gửi tối đa {previewCount} credit, chỉ tính khi gửi thành công.</p>
        </div>
        <Button className={`w-full gap-2 sm:w-auto ${isCustom ? "bg-primary text-inverse-foreground hover:bg-primary-hover" : ""}`} disabled={busy || !canGenerate} onClick={onGenerate} type="button">
          <Sparkles className="h-4 w-4" />
          Lưu và tạo bản xem trước AI
        </Button>
      </div>
    </div>
  );
}
