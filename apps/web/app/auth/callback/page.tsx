"use client";

import Link from "next/link";
import { buttonStyles } from "@/components/ui-styles";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Loader2, CircleAlert } from "lucide-react";
import { AuthShell, AuthHeading } from "@/components/auth-shell";
import { apiFetch, type AuthTokenResponse } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { toast } from "sonner";

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
  const callbackMessage = getCallbackMessage(searchParams.get("status"), searchParams.get("error"));
  const [message, setMessage] = useState(callbackMessage);
  const [isLoading, setIsLoading] = useState(Boolean(idToken) && !callbackMessage);

  useEffect(() => {
    if (callbackMessage) {
      toast.error(callbackMessage);
    }
  }, [callbackMessage]);

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
          const text = "Vui lòng đăng nhập bằng mật khẩu trước, sau đó liên kết Google trong hồ sơ bảo mật.";
          setMessage(text);
          toast.error(text);
        } else if (error.message.includes("401")) {
          const text = "Email Google chưa được xác minh hoặc mã đăng nhập không hợp lệ.";
          setMessage(text);
          toast.error(text);
        } else {
          const text = "Không thể liên kết tài khoản Google với tài khoản hiện tại.";
          setMessage(text);
          toast.error(text);
        }
      })
      .finally(() => setIsLoading(false));
  }, [idToken, message, router]);

  return (
    <AuthShell mode="callback">
      <AuthHeading title="Xác thực Google" description="Hoàn tất đăng nhập để tiếp tục vào FormAuto Hub." />
      <div className="space-y-6">
        {isLoading ? (
          <div role="status" className="flex items-center gap-3 rounded-xl bg-primary-soft p-5 text-sm text-primary">
            <Loader2 aria-hidden="true" className="animate-spin" size={22} />Đang xác thực tài khoản Google...
          </div>
        ) : message ? (
          <div role="alert" className="flex items-start gap-3 rounded-xl bg-destructive-surface p-5 text-sm leading-6 text-destructive">
            <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={22} />{message}
          </div>
        ) : (
          <p role="status" className="rounded-xl bg-info-surface p-5 text-sm leading-6 text-info">Vui lòng quay lại đăng nhập để xác thực tài khoản Google.</p>
        )}
        <Link className={buttonStyles({ variant: "secondary", size: "lg", className: "w-full text-primary hover:bg-primary-soft" })} href="/login">Quay lại đăng nhập</Link>
      </div>
    </AuthShell>
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
