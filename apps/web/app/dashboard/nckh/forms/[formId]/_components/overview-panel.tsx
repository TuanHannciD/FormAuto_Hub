import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { Card, CardContent, CardHeader, CardTitle, KeyValueRow } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import type { NckhFormDetailResponse, NckhFormQuestion, NckhResearchModel } from "@/lib/api";
import { formatDate } from "../_helpers";

export function OverviewPanel({
  form,
  model,
  questionColumns
}: {
  form: NckhFormDetailResponse;
  model: NckhResearchModel;
  questionColumns: BaseTableColumn<NckhFormQuestion>[];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardHeader><CardTitle>Mô hình đang mở</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <KeyValueRow label="Tên" value={model.name} />
          <KeyValueRow label="Trạng thái" value={<StatusBadge status={model.status} />} />
          <KeyValueRow label="Số biến" value={model.variableCount} />
          <KeyValueRow label="Mô tả" value={model.description || "-"} />
          <KeyValueRow label="Cập nhật" value={formatDate(model.updatedAt)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Câu hỏi đã nhập</CardTitle></CardHeader>
        <CardContent>
          <BaseTable columns={questionColumns} items={form.questions} getRowKey={(item) => item.id} emptyTitle="Chưa có câu hỏi" emptyDetail="Nhập lại form nếu cấu trúc câu hỏi chưa được lưu." />
        </CardContent>
      </Card>
    </div>
  );
}
