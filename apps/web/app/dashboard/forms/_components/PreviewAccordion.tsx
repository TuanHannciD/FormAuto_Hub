import { panelStyles } from "@/components/ui-styles";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import type { GeneratedResponse } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { AnswerCards } from "./AnswerCards";

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
    <div className={`${panelStyles} overflow-hidden`}>
      <button
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40"
        onClick={onToggle}
        type="button"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info-surface text-sm font-semibold text-info">
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
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div role="region" aria-label={`Câu trả lời bản xem trước ${index + 1}`} tabIndex={0} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary max-h-[420px] space-y-2 overflow-y-auto border-t border-border bg-surface p-3">
          <AnswerCards answers={preview.answers} />
        </div>
      )}
    </div>
  );
}
