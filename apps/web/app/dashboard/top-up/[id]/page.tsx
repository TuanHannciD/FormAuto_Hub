"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TopupOrderDetailDialog } from "../_components/topup-order-detail";
import { Button, Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui";
import { ApiError, apiFetch, apiFetchBlob, type TopupOrder } from "@/lib/api";
import { showError } from "@/lib/toast";

export default function TopUpOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loadedOrder, setOrder] = useState<TopupOrder | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [evidenceError, setEvidenceError] = useState(false);
  const [isMissing, setIsMissing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadedId, setLoadedId] = useState(params.id);
  const [retry, setRetry] = useState(0);
  const currentRequest = loadedId === params.id;
  const order = currentRequest ? loadedOrder : null;

  function closeDialog() {
    router.push("/dashboard/top-up");
  }

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoadedId(params.id);
    setOrder(null);
    setIsMissing(false);
    setLoadError(false);
    apiFetch<TopupOrder>(`/api/topup-orders/${params.id}`, { signal: controller.signal })
      .then((data) => {
        if (cancelled) return;
        setOrder(data);
        setIsMissing(false);
      })
      .catch((error) => {
        if (cancelled) return;
        const missing = error instanceof ApiError && error.status === 404;
        setIsMissing(missing);
        setLoadError(!missing);
        if (!missing) showError(error, "Không tải được chi tiết yêu cầu nạp.");
      });
    return () => { cancelled = true; controller.abort(); };
  }, [params.id, retry]);

  useEffect(() => {
    setEvidenceUrl(null); setEvidenceError(false);
    if (!order?.evidenceFileId) {
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;
    apiFetchBlob(`/api/topup-orders/evidence/${order.evidenceFileId}`)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setEvidenceUrl(objectUrl);
      })
      .catch((error) => {
        if (cancelled) return;
        setEvidenceError(true);
        setEvidenceUrl(null);
        showError(error, "Không tải được ảnh minh chứng.");
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [order?.evidenceFileId]);

  if (currentRequest && isMissing) {
    return (
      <Dialog open className="max-w-3xl" onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Không tìm thấy yêu cầu nạp</DialogTitle>
            <DialogDescription>Yêu cầu có thể không tồn tại hoặc không thuộc tài khoản hiện tại.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose variant="primary">Đóng</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (currentRequest && loadError) {
    return <Dialog open className="max-w-3xl" onOpenChange={open => !open && closeDialog()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chi tiết yêu cầu nạp</DialogTitle>
          <DialogDescription>Không tải được chi tiết yêu cầu nạp.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={() => setRetry(value => value + 1)}>Thử lại</Button>
          <DialogClose>Đóng</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
  }

  if (!order) {
    return (
      <Dialog open className="max-w-3xl" onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu nạp</DialogTitle>
            <DialogDescription>Đang tải thông tin yêu cầu nạp...</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">Vui lòng chờ trong giây lát.</p>
          </DialogBody>
        </DialogContent>
      </Dialog>
    );
  }

  return <TopupOrderDetailDialog order={order} evidenceUrl={evidenceUrl} evidenceError={evidenceError} onClose={closeDialog} />;
}
