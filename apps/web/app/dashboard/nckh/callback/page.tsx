"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { apiFetch, type NckhGoogleLinkResponse } from "@/lib/api";
import { toast } from "sonner";

function NckhCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const exchangedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    // Xử lý lỗi Google OAuth.
    if (errorParam) {
      const msg = "Google từ chối cấp quyền hoặc phiên xác thực đã bị hủy.";
      setMessage(msg);
      toast.error(msg);
      const timer = setTimeout(() => router.replace("/dashboard/nckh?error=" + encodeURIComponent(msg)), 3000);
      return () => clearTimeout(timer);
    }

    // Không có code thì quay lại trang NCKH.
    if (!code) {
      router.replace("/dashboard/nckh");
      return;
    }

    if (exchangedCodeRef.current === code) {
      return;
    }
    exchangedCodeRef.current = code;

    // Đổi authorization code lấy token liên kết Google.
    setIsProcessing(true);
    apiFetch<NckhGoogleLinkResponse>("/api/v1/nckh/auth/google-link", {
      method: "POST",
      json: { authorizationCode: code, redirectUri: window.location.origin + "/dashboard/nckh/callback" }
    })
      .then((result) => {
        toast.success(`Đã liên kết Google: ${result.email}`);
        router.replace("/dashboard/nckh?linked=true");
      })
      .catch((error: Error) => {
        const errMsg = error.message.toLowerCase();
        const msg = errMsg.includes("409") || errMsg.includes("already linked") || errMsg.includes("đã được liên kết")
          ? "Tài khoản Google này đã được liên kết trước đó."
          : errMsg.includes("400") || errMsg.includes("invalid") || errMsg.includes("failed to exchange") || errMsg.includes("expired")
            ? "Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng thử lại."
          : "Không liên kết được tài khoản Google. Vui lòng thử lại.";
        setMessage(msg);
        toast.error(msg);
        const timer = setTimeout(() => router.replace("/dashboard/nckh?error=" + encodeURIComponent(msg)), 4000);
        return () => clearTimeout(timer);
      })
      .finally(() => setIsProcessing(false));
  }, [code, errorParam, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-6 sm:px-5 sm:py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Liên kết Google — NCKH</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isProcessing ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" size={18} />
              Đang liên kết tài khoản Google...
            </div>
          ) : message ? (
            <p className="text-sm text-muted-foreground">
              {message}
            </p>
          ) : !code && !errorParam ? (
            <p className="text-sm text-muted-foreground">
              Không có mã xác thực. Đang quay lại trang NCKH...
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Bạn sẽ được tự động chuyển về trang NCKH sau vài giây.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default function NckhCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          <Loader2 className="animate-spin mr-2" size={18} />
          Đang xử lý liên kết Google...
        </main>
      }
    >
      <NckhCallbackContent />
    </Suspense>
  );
}

