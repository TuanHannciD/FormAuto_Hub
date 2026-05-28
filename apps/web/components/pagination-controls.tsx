"use client";

import { Button } from "@/components/ui";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  onPrevious,
  onNext
}: PaginationControlsProps) {
  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border/70 pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        Trang {totalPages === 0 ? 0 : page}/{totalPages} · {totalItems} kết quả
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" disabled={page <= 1} onClick={onPrevious}>
          Trước
        </Button>
        <Button type="button" variant="secondary" disabled={totalPages === 0 || page >= totalPages} onClick={onNext}>
          Sau
        </Button>
      </div>
    </div>
  );
}
