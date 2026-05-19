"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { apiFetch, type AuthTokenResponse } from "@/lib/api";
import { saveSession } from "@/lib/auth";

function getCallbackMessage(status: string | null, error: string | null) {
  if (status === "provider-unavailable") {
    return "Nhà cung cấp đăng nhập hiện không khả dụng. Vui lòng thử lại sau.";
  }

  if (error === "email-not-verified") {
    return "Email Google chưa được xác minh. Vui lòng xác minh email trước khi tiếp tục.";
  }

  if (error === "link-required") {
    return "Vui lòng đăng nhập bằng mật khẩu trước, sau đó liên kết Google trong hồ sơ bảo mật.";
  }

  return "";
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idToken = searchParams.get("id_token");
  const [message, setMessage] = useState(getCallbackMessage(searchParams.get("status"), searchParams.get("error")));
  const [isLoading, setIsLoading] = useState(Boolean(idToken) && !message);

  useEffect(() => {
    if (!idToken || message) {
      setIsLoading(false);
      return;
    }

    apiFetch<AuthTokenResponse>("/api/auth/google", {
      method: "POST",
      skipAuth: true,
      json: { idToken }
    })
      .then((session) => {
        saveSession(session);
        router.replace("/dashboard");
      })
      .catch((error: Error) => {
        if (error.message.includes("409") || error.message.toLowerCase().includes("password")) {
          setMessage("Vui lòng đăng nhập bằng mật khẩu trước, sau đó liên kết Google trong hồ sơ bảo mật.");
        } else if (error.message.includes("401")) {
          setMessage("Email Google chưa được xác minh hoặc mã đăng nhập không hợp lệ.");
        } else {
          setMessage("Không thể liên kết tài khoản Google với tài khoản hiện tại.");
        }
      })
      .finally(() => setIsLoading(false));
  }, [idToken, message, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Xác thực Google</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" size={18} />
              Đang xác thực tài khoản Google...
            </div>
          ) : message ? (
            <Alert className="border-amber-200 bg-amber-50 text-amber-800">{message}</Alert>
          ) : (
            <Alert>Đăng nhập thành công. Đang chuyển vào bảng điều khiển...</Alert>
          )}
          <Link
            className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium transition hover:bg-muted"
            href="/login"
          >
            Quay lại đăng nhập
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Đang xác thực tài khoản Google...
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
