"use client";

import { useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui";
import { useConfirmDialog } from "@/components/confirm-dialog";

export default function DialogFixture() {
  const [open, setOpen] = useState(false);
  const [tall, setTall] = useState(false);
  const [deletions, setDeletions] = useState(0);
  const confirmation = useConfirmDialog();
  return <>
    {confirmation.dialog}
    <button onClick={async () => { if (await confirmation.confirm("Xóa dữ liệu thử?")) setDeletions(value => value + 1); }}>Request deletion</button>
    <output aria-label="Confirmed deletions">{deletions}</output>
    <button onClick={() => setOpen(true)}>Open popup</button>
    <button onClick={() => setOpen(false)}>External close</button>
    <button onClick={() => { setOpen(false); requestAnimationFrame(() => setOpen(true)); }}>Reopen while closing</button>
    <button onClick={() => setTall(value => !value)}>Change size</button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>Shared popup</DialogTitle>
        <div style={{ height: tall ? 1200 : 180 }}>Popup content</div>
        <button onClick={async () => { if (await confirmation.confirm("Xóa dữ liệu thử?")) setDeletions(value => value + 1); }}>Request nested deletion</button>
        <DialogClose>Close popup</DialogClose>
      </DialogContent>
    </Dialog>
  </>;
}
