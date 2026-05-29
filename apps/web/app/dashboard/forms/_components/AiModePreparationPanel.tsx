import { LockKeyhole, Sparkles, Wand2 } from "lucide-react";
import { Badge, Button, Input, Textarea } from "@/components/ui";
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
      <div className={`rounded-lg border p-4 shadow-sm ring-1 ${
        isCustom
          ? "border-violet-200 bg-violet-50/75 text-violet-950 ring-violet-100"
          : "border-cyan-200 bg-cyan-50/80 text-cyan-950 ring-cyan-100"
      }`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={isCustom ? "warning" : "info"}>{isCustom ? "Option 3" : "Option 2"}</Badge>
              <Badge tone="neutral">API thật</Badge>
              <Badge tone={isCustom ? "warning" : "info"}>x{multiplier} credit</Badge>
            </div>
            <p className="mt-2 text-sm font-semibold">{isCustom ? "AI tùy chỉnh theo hướng dẫn" : "AI mặc định với câu hỏi thu gọn"}</p>
            <p className="mt-1 text-xs leading-5 opacity-80">
              Backend dùng câu hỏi/options đã lưu, kiểm tra output trước khi lưu preview và không trả raw provider payload về giao diện.
            </p>
          </div>
          <Button className="w-full gap-2 md:w-auto" disabled={busy} type="button" variant="secondary" onClick={onAutoFill}>
            <Wand2 className="h-4 w-4" />
            Điền prompt
          </Button>
        </div>
      </div>

      {isCustom && (
        <div className="rounded-lg border border-violet-200 bg-white/72 p-4 shadow-sm backdrop-blur">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-600" />
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

      <div className="rounded-lg border border-border/70 bg-white/72 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <label className="block flex-1 text-sm font-medium">
            Prompt chung
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
            <div className="grid shrink-0 grid-cols-2 gap-2 rounded-lg border border-border/70 bg-white/75 p-2 text-sm font-semibold md:w-64">
              <button
                className={`rounded-md px-3 py-2 transition ${aiPromptScope === "global" ? "bg-cyan-600 text-white shadow-sm" : "text-muted-foreground hover:bg-cyan-50"}`}
                type="button"
                onClick={() => onPromptScopeChange("global")}
              >
                Prompt chung
              </button>
              <button
                className={`rounded-md px-3 py-2 transition ${aiPromptScope === "per-question" ? "bg-cyan-600 text-white shadow-sm" : "text-muted-foreground hover:bg-cyan-50"}`}
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

      <div className={`sticky bottom-3 z-10 flex flex-col gap-4 rounded-lg border p-4 shadow-soft ring-1 backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between ${
        isCustom
          ? "border-violet-200/80 bg-violet-50/90 ring-violet-100"
          : "border-cyan-200/80 bg-cyan-50/90 ring-cyan-100/70"
      }`}>
        <div className="w-full sm:w-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-800 shadow-sm">
            <LockKeyhole className="h-3.5 w-3.5" />
            AI preview chỉ đọc
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-950">Số câu trả lời xem trước</p>
          <p className="mt-1 text-xs text-slate-600">Tối thiểu 1, tối đa {PREVIEW_COUNT_MAX}; chi phí thật sẽ là {previewCount * multiplier} credit.</p>
          <Input
            className="mt-2 w-full sm:w-32"
            inputMode="numeric"
            max={PREVIEW_COUNT_MAX}
            min={PREVIEW_COUNT_MIN}
            step={1}
            type="number"
            value={previewCount}
            onChange={(event) => onPreviewCountChange(clampInteger(event.target.value, PREVIEW_COUNT_MIN, PREVIEW_COUNT_MAX))}
          />
          <p className="mt-2 text-xs font-medium text-cyan-800">
            Prompt sẽ được lưu trước, sau đó backend tạo AI preview read-only và trừ credit theo số preview hợp lệ.
          </p>
        </div>
        <Button className={`w-full gap-2 sm:w-auto ${isCustom ? "bg-violet-600 text-white hover:bg-violet-700" : ""}`} disabled={busy || !canGenerate} onClick={onGenerate} type="button">
          <Sparkles className="h-4 w-4" />
          Lưu và tạo AI preview
        </Button>
      </div>
    </div>
  );
}