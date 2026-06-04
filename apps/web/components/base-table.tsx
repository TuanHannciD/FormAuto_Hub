import type { ReactNode } from "react";
import { EmptyState, KeyValueRow, MobileRecord, MobileRecordList } from "@/components/ui";
import { cn } from "@/lib/utils";

export type BaseTableColumn<T> = {
  key: string;
  header: ReactNode;
  mobileLabel?: string;
  render: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  hideOnMobile?: boolean;
};

export function BaseTable<T>({
  items,
  columns,
  getRowKey,
  emptyTitle,
  emptyDetail,
  minWidthClassName = "min-w-[720px]",
  mobileFooter
}: {
  items: T[];
  columns: Array<BaseTableColumn<T>>;
  getRowKey: (item: T) => string;
  emptyTitle: string;
  emptyDetail: string;
  minWidthClassName?: string;
  mobileFooter?: (item: T) => ReactNode;
}) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} detail={emptyDetail} />;
  }

  return (
    <>
      <MobileRecordList>
        {items.map((item) => (
          <MobileRecord key={getRowKey(item)}>
            {columns
              .filter((column) => !column.hideOnMobile)
              .map((column) => (
                <KeyValueRow
                  key={column.key}
                  label={String(column.mobileLabel ?? column.header)}
                  value={column.render(item)}
                />
              ))}
            {mobileFooter?.(item)}
          </MobileRecord>
        ))}
      </MobileRecordList>
      <div className="hidden overflow-x-auto md:block">
        <table className={cn("w-full text-left text-sm", minWidthClassName)}>
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={cn("px-3 py-2 font-semibold", column.headerClassName)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="border-t border-border/70" key={getRowKey(item)}>
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-3 py-3 align-top", column.className)}>
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
