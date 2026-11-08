import { FileText } from "lucide-react";

export type AnswerCardItem = { label?: string | null; values: string[] };

export function AnswerCards({ answers, compact = false }: { answers: AnswerCardItem[]; compact?: boolean }) {
  return <div className="space-y-2">
    {answers.map((answer, index) => <div className={`rounded-xl border border-border bg-surface ${compact ? "px-3 py-2.5" : "px-3 py-3"}`} key={`${answer.label ?? "answer"}-${index}`}>
      <div className="mb-2 flex items-start gap-2 text-xs font-medium text-muted-foreground"><FileText aria-hidden className="h-3.5 w-3.5 shrink-0" /><span className="min-w-0 break-words">{answer.label || "Câu hỏi"}</span></div>
      <div className="space-y-1">{answer.values.map((value, valueIndex) => <p className="break-words text-sm font-medium" key={`${index}-${valueIndex}`}>{value || "Chưa có câu trả lời"}</p>)}</div>
    </div>)}
  </div>;
}
