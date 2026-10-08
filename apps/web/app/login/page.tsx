"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AuthShell, AuthHeading, AuthSwitch } from "@/components/auth-shell";
import { AuthPasswordInput } from "@/components/auth-password-input";
import { GoogleIdentityButton } from "@/components/google-identity-button";
import { Button, Input } from "@/components/ui";
import { apiFetch, type AuthTokenResponse } from "@/lib/api";
import { clearStoredSession, getStoredSession, hasUsableSession, saveSession } from "@/lib/auth";
import { readableError } from "@/lib/toast";
import { toast } from "sonner";

function authErrorMessage(message: string) {
  if (message.includes("423")) {
    return "Tài khoản bị khóa tạm thời. Vui lòng thử lại sau 15 phút.";
  }

  if (message.includes("401")) {
    return "Email hoặc mật khẩu không đúng.";
  }

  return readableError(message, "Không đăng nhập được. Vui lòng thử lại.");
}

function googleAuthErrorMessage(message: string) {
  if (message.includes("409") || message.toLowerCase().includes("password")) {
    return "Email này đã có tài khoản mật khẩu. Hãy đăng nhập bằng mật khẩu rồi liên kết Google trong hồ sơ bảo mật.";
  }

  return authErrorMessage(message);
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (hasUsableSession()) {
      router.replace("/dashboard");
      return;
    }
    if (getStoredSession()) {
      clearStoredSession();
    }
    if (searchParams.get("reason") === "session-expired") {
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", { id: "session-expired" });
      router.replace("/login");
    }
  }, [router, searchParams]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const session = await apiFetch<AuthTokenResponse>("/api/auth/login", {
        method: "POST",
        skipAuth: true,
        json: { email, password }
      });
      saveSession(session);
      router.replace("/dashboard");
    } catch (error) {
      const message = authErrorMessage(error instanceof Error ? error.message : "");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      setFormError("");
      setIsSubmitting(true);
      try {
        const session = await apiFetch<AuthTokenResponse>("/api/auth/google", {
          method: "POST",
          skipAuth: true,
          json: { idToken }
        });
        saveSession(session);
        router.replace("/dashboard");
      } catch (error) {
        const message = googleAuthErrorMessage(error instanceof Error ? error.message : "");
        setFormError(message);
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  return (
    <AuthShell mode="login">
      <AuthHeading title="Đăng nhập" description="Nhập thông tin tài khoản của bạn." />
      <form className="grid gap-5" onSubmit={submit} aria-busy={isSubmitting}>
        <label className="grid gap-2 text-[13px] font-bold">
          Email
          <Input controlSize="lg" name="email" type="email" autoComplete="email" inputMode="email" placeholder="ban@example.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} required />
        </label>
        <label className="grid gap-2 text-[13px] font-bold">
          Mật khẩu
          <AuthPasswordInput name="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={isSubmitting} required />
        </label>
        <p className="text-right text-xs text-secondary-foreground">Quên mật khẩu – Đang cập nhật</p>
        {formError && <p role="alert" className="rounded-xl bg-destructive-surface px-4 py-3 text-sm text-destructive">{formError}</p>}
        <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>
      <div className="mt-6">
        <GoogleIdentityButton disabled={isSubmitting} text="signin_with" onCredential={loginWithGoogle} onUnavailable={() => setFormError("Đăng nhập với Google hiện chưa khả dụng. Vui lòng thử lại sau.")} />
      </div>
      <AuthSwitch mode="login" />
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Đang mở đăng nhập...
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
