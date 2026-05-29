import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Badge } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import type { GeneratedResponse } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export function PreviewAccordion({
  index,
  preview,
  isAiPreview,
  open,
  onToggle
}: {
  index: number;
  preview: GeneratedResponse;
  isAiPreview?: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/70 bg-white/72 shadow-sm backdrop-blur">
      <button
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40"
        onClick={onToggle}
        type="button"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-sm font-semibold text-cyan-700">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 font-semibold">
            Bản xem trước #{index + 1}
            {isAiPreview && <Badge tone="warning">AI chỉ đọc</Badge>}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {preview.answers.length} câu trả lời · {formatDate(preview.createdAt)}
          </span>
        </span>
        <span className="hidden sm:inline-flex"><StatusBadge status={preview.status} /></span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-white/80 text-muted-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className="max-h-[420px] space-y-2 overflow-y-auto border-t border-border/70 bg-white/45 p-3">
          {preview.answers.map((answer, answerIndex) => (
            <div className="rounded-lg border border-border/70 bg-white/80 px-3 py-3" key={`${preview.id}-${answer.questionId}-${answerIndex}`}>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span className="truncate">{answer.label || "Không có tiêu đề"}</span>
              </div>
              <div className="space-y-1">
                {answer.values.map((value, valueIndex) => (
                  <p className="break-words text-sm font-medium" key={`${preview.id}-${answer.questionId}-${valueIndex}`}>
                    {value || "Không có câu trả lời"}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
