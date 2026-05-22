"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { displayStatus } from "@/lib/labels";

const FORM_PREVIEW_RESUME_KEY = "formauto.formPreviewResume";
const FORM_PREVIEW_RESUME_EVENT_KEY = "formauto.formPreviewResumeEvent";
const FORM_PREVIEW_RESUME_CHANNEL = "formauto.formPreviewResume";

export default function PayosReturnPage() {
  return (
    <Suspense fallback={<PaymentResultShell title="Đang đọc kết quả thanh toán" />}>
      <PayosReturnContent />
    </Suspense>
  );
}

function PayosReturnContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "PENDING";
  const orderCode = searchParams.get("orderCode") ?? "";
  const cancelled = searchParams.get("cancel") === "true";

  const title = cancelled
    ? "Thanh toán đã hủy"
    : status.toUpperCase() === "PAID"
      ? "PayOS đã ghi nhận thanh toán"
      : "Đang chờ xác minh thanh toán";

  return <PaymentResultShell title={title} orderCode={orderCode} status={status} cancelled={cancelled} />;
}

function PaymentResultShell({
  title,
  orderCode = "",
  status = "PENDING",
  cancelled = false
}: {
  title: string;
  orderCode?: string;
  status?: string;
  cancelled?: boolean;
}) {
  const router = useRouter();
  const [hasFormPreviewResume, setHasFormPreviewResume] = useState(false);

  useEffect(() => {
    setHasFormPreviewResume(Boolean(window.localStorage.getItem(FORM_PREVIEW_RESUME_KEY)));
  }, []);

  function returnToFormPreviewProgress() {
    const payload = JSON.stringify({ type: "form-preview-resume", at: Date.now() });
    window.localStorage.setItem(FORM_PREVIEW_RESUME_EVENT_KEY, payload);
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(FORM_PREVIEW_RESUME_CHANNEL);
      channel.postMessage(payload);
      channel.close();
    }

    window.close();
    window.setTimeout(() => {
      router.push("/dashboard/forms?resume=form-preview");
    }, 150);
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-6 sm:px-5 sm:py-10">
      <div className="mx-auto max-w-2xl space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              Credit không được cộng từ trang này. Hệ thống chỉ cập nhật số dư sau khi backend nhận và xác minh webhook PayOS hợp lệ.
            </Alert>
            <div className="grid gap-3 text-sm">
              <Detail label="Mã giao dịch PayOS" value={orderCode || "Chưa có"} />
              <Detail label="Trạng thái từ PayOS" value={displayStatus(status)} />
              <Detail label="Kết quả hủy" value={cancelled ? "Đã hủy" : "Không"} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {hasFormPreviewResume && (
                <Button type="button" onClick={returnToFormPreviewProgress}>
                  Quay lại tiếp tục tạo preview
                </Button>
              )}
              <Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/dashboard">
                Về tổng quan
              </Link>
              <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium" href="/dashboard/top-up">
                Xem lịch sử nạp
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}
