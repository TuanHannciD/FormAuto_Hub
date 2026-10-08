import Link from "next/link";
import { ClipboardList, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { GenerationMode } from "../_types";

export function WorkflowSummary({ title, questionCount, mode, requestedCount, previewCount, multiplier, balance, creditsUsed, stale }: {
  title?: string;
  questionCount: number;
  mode: GenerationMode;
  requestedCount: number;
  previewCount: number;
  multiplier: number;
  balance: number | null;
  creditsUsed?: number;
  stale: boolean;
}) {
  return (
    <aside aria-label="Tóm tắt lượt tạo" className="min-w-0 xl:sticky xl:top-24 xl:self-start">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList size={18} className="text-primary" />Tóm tắt lượt tạo</CardTitle></CardHeader>
        <CardContent className="space-y-5 text-sm">
          <div><p className="break-words font-semibold">{title || "Chưa chọn biểu mẫu"}</p><p className="mt-1 text-xs text-muted-foreground">{questionCount} câu hỏi được hỗ trợ</p></div>
          <dl className="space-y-3">
            {[
              ["Cách tạo", mode === "rules" ? "Quy tắc" : mode === "ai-default" ? "AI mặc định" : "AI tùy chỉnh"],
              ["Số lượt yêu cầu", requestedCount],
              ["Preview hiện có", previewCount],
              ["Credit mỗi preview", multiplier],
              ["Chi phí dự kiến", `${requestedCount * multiplier} credit`],
              ["Đã sử dụng", creditsUsed === undefined ? "—" : `${creditsUsed} credit`]
            ].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>)}
          </dl>
          <div className="border-t border-border pt-4">
            <p className="flex items-center gap-2 font-semibold"><Coins size={17} className="text-primary" />{balance === null ? "Chưa tải được số dư" : `${balance} credit khả dụng`}</p>
            <Link href="/dashboard/top-up" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Nạp credit →</Link>
          </div>
          {stale && <p className="rounded-xl bg-warning-surface p-3 text-xs leading-5 text-warning">Preview thuộc cấu hình trước. Cần tạo lại trước khi gửi.</p>}
          <p className="text-xs leading-5 text-muted-foreground">Một preview là một bộ câu trả lời cho toàn bộ biểu mẫu. Credit được trừ khi preview hợp lệ được tạo và lưu thành công. Phân tích biểu mẫu và điền prompt không trừ credit.</p>
        </CardContent>
      </Card>
    </aside>
  );
}
