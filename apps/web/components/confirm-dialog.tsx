"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "./dialog";

type Confirmation = { message: string; resolve: (confirmed: boolean) => void };

// Resolve only after the shared popup has finished closing. Dismissal always cancels.
export function useConfirmDialog() {
  const [request, setRequest] = useState<Confirmation | null>(null);
  const pending = useRef<Confirmation | null>(null);
  const accepted = useRef(false);
  const confirm = useCallback((message: string): Promise<boolean> => {
    if (pending.current) return Promise.resolve(false);
    accepted.current = false;
    return new Promise(resolve => {
      pending.current = { message, resolve };
      setRequest(pending.current);
    });
  }, []);
  useEffect(() => () => { pending.current?.resolve(false); pending.current = null; }, []);

  const dialog = request && <Dialog open className="max-w-lg" onOpenChange={open => {
    if (open) return;
    const result = pending.current;
    pending.current = null;
    setRequest(null);
    result?.resolve(accepted.current);
  }}>
    <DialogContent>
      <div className="p-5">
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <p className="mt-3 text-sm text-muted-foreground">{request.message}</p>
      </div>
      <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
        <DialogClose>Hủy</DialogClose>
        <DialogClose variant="danger" onClick={() => { accepted.current = true; }}>Xóa</DialogClose>
      </div>
    </DialogContent>
  </Dialog>;
  return { confirm, dialog };
}
