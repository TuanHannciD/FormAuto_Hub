import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { EmptyState } from "@/components/ui";
import type { NckhDatasetListResponse } from "@/lib/api";
import type { DatasetPreviewRow } from "../_types";

export function DatasetPreview({ dataset }: { dataset: NckhDatasetListResponse | null }) {
  if (!dataset || dataset.items.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Bộ dữ liệu</h3>
        <EmptyState title="Chưa có bộ dữ liệu" detail="Chạy chuẩn hóa sau khi đã có phản hồi thô và ánh xạ." />
      </div>
    );
  }

  const previewColumns = dataset.columns.slice(0, 6);
  const rows: DatasetPreviewRow[] = dataset.items.map((item, index) => ({
    ...item,
    previewKey: `${item.respondentId ?? "row"}-${index}`
  }));
  const columns: BaseTableColumn<DatasetPreviewRow>[] = [
    { key: "respondent", header: "Người trả lời", render: (item) => item.respondentId || "-" },
    ...previewColumns.map((column): BaseTableColumn<DatasetPreviewRow> => ({
      key: column,
      header: column,
      render: (item) => String(item.values[column] ?? "")
    })),
    { key: "stale", header: "Đã cũ", render: (item) => (item.isStale ? "Có" : "Không") }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Bộ dữ liệu</h3>
      <BaseTable columns={columns} items={rows} getRowKey={(item) => item.previewKey} emptyTitle="Chưa có bộ dữ liệu" emptyDetail="Chạy chuẩn hóa sau khi đã có phản hồi thô và ánh xạ." />
    </div>
  );
}
