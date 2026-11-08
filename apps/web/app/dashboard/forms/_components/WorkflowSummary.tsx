import Link from "next/link";
import { ClipboardList, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { GenerationMode } from "../_types";

export function WorkflowSummary({ title, questionCount, mode, requestedCount, previewCount, sendCount, generationCredits, multiplier, balance, reserved, posted, creditsUsed, directSuccessCount, directFailedCount, stale }: {
  title?: string;
  questionCount: number;
  mode: GenerationMode;
  requestedCount: number;
  previewCount: number;
  sendCount?: number;
  generationCredits?: number;
  multiplier: number;
  balance: number | null;
  reserved?: number | null;
  posted?: number | null;
  creditsUsed?: number;
  directSuccessCount?: number;
  directFailedCount?: number;
  stale: boolean;
}) {
  return (
    <aside aria-label="Tóm tắt lượt tạo" className="min-w-0 xl:sticky xl:top-24 xl:self-start">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList size={18} className="text-primary" />Bạn sắp thực hiện</CardTitle><p className="mt-1 text-xs text-muted-foreground">Kiểm tra số lượng và phí trước khi bắt đầu.</p></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div><p className="break-words font-semibold">{title || "Chưa chọn biểu mẫu"}</p><p className="mt-1 text-xs text-muted-foreground">{questionCount} câu hỏi được hỗ trợ</p></div>
          <dl className="space-y-2">
            {[
              ["Cách tạo", mode === "rules" ? "Quy tắc" : mode === "ai-default" ? "AI mặc định" : "AI tùy chỉnh"],
              ["Số bản trả lời", requestedCount],
              [mode === "rules" ? "Đã nhận xử lý" : "Bản xem trước", previewCount],
              ...(mode === "rules" ? [["Gửi thành công", directSuccessCount ?? "—"], ["Gửi thất bại", directFailedCount ?? "—"]] : []),
              ["Tốn mỗi bản", `${multiplier + 1} credit`],
              [generationCredits === undefined ? "Tổng dự kiến" : "Tổng đã trả", `${(generationCredits ?? requestedCount * multiplier) + (sendCount ?? requestedCount)} credit`],
              ["Phí gửi tối đa", `${sendCount ?? requestedCount} credit`],
              ["Đã sử dụng", creditsUsed === undefined ? "—" : `${creditsUsed} credit`]
            ].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words text-right font-semibold tabular-nums">{value}</dd></div>)}
          </dl>
          <div className="border-t border-border pt-4">
            <p className="flex items-center gap-2 font-semibold tabular-nums"><Coins size={17} className="shrink-0 text-primary" />{balance === null ? "Chưa tải được số dư" : `${balance} credit khả dụng`}</p>
            <p className="mt-1 text-xs text-muted-foreground">Đã ghi sổ: {posted ?? "—"} · Đang giữ: {reserved ?? "—"} credit</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Chỉ trừ phí gửi khi gửi thành công. Kết quả chưa xác định vẫn giữ credit để đối soát.</p>
            <Link href="/dashboard/top-up" className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline sm:min-h-8">Nạp credit →</Link>
          </div>
          {stale && <p className="rounded-xl bg-warning-surface p-3 text-xs leading-5 text-warning">Bản xem trước thuộc cấu hình cũ. Hãy tạo lại trước khi gửi.</p>}

        </CardContent>
      </Card>
    </aside>
  );
}
