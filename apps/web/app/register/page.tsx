"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { AuthShell, AuthHeading, AuthSwitch } from "@/components/auth-shell";
import { AuthPasswordInput } from "@/components/auth-password-input";
import { GoogleIdentityButton } from "@/components/google-identity-button";
import { Button, Input } from "@/components/ui";
import { apiFetch, type AuthTokenResponse } from "@/lib/api";
import { getStoredSession, saveSession } from "@/lib/auth";
import { readableError } from "@/lib/toast";
import { toast } from "sonner";

function registerErrorMessage(message: string) {
  if (message.includes("409") || message.toLowerCase().includes("already") || message.toLowerCase().includes("password")) {
    return "Email đã tồn tại. Hãy đăng nhập bằng mật khẩu rồi liên kết Google trong hồ sơ bảo mật.";
  }

  if (message.includes("400")) {
    return "Thông tin đăng ký không hợp lệ.";
  }

  return readableError(message, "Không tạo được tài khoản.");
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (getStoredSession()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (password.length < 8) {
      toast.error("Mật khẩu tối thiểu 8 ký tự.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);
    try {
      const session = await apiFetch<AuthTokenResponse>("/api/auth/register", {
        method: "POST",
        skipAuth: true,
        json: { fullName, email, password }
      });
      saveSession(session);
      router.replace("/dashboard");
    } catch (error) {
      const message = registerErrorMessage(error instanceof Error ? error.message : "");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const registerWithGoogle = useCallback(
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
        const message = registerErrorMessage(error instanceof Error ? error.message : "");
        setFormError(message);
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  return (
    <AuthShell mode="register">
      <AuthHeading title="Tạo tài khoản" description="Chỉ cần ba thông tin để bắt đầu." />
      <form className="grid gap-5" onSubmit={submit} aria-busy={isSubmitting}>
        <label className="grid gap-2 text-[13px] font-bold">
          Họ tên
          <Input className="min-h-[54px] rounded-xl border-border-strong bg-surface text-[15px]" name="fullName" autoComplete="name" placeholder="Nguyễn Minh Anh" value={fullName} onChange={(event) => setFullName(event.target.value)} disabled={isSubmitting} required />
        </label>
        <label className="grid gap-2 text-[13px] font-bold">
          Email
          <Input className="min-h-[54px] rounded-xl border-border-strong bg-surface text-[15px]" name="email" type="email" autoComplete="email" inputMode="email" placeholder="ban@example.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} required />
        </label>
        <label className="grid gap-2 text-[13px] font-bold">
          Mật khẩu
          <AuthPasswordInput name="password" autoComplete="new-password" minLength={8} aria-describedby="password-help" value={password} onChange={(event) => setPassword(event.target.value)} disabled={isSubmitting} required />
          <span id="password-help" className="text-[11px] font-medium leading-5 text-secondary-foreground">Mật khẩu tối thiểu 8 ký tự. Bạn có thể dán mật khẩu từ trình quản lý mật khẩu.</span>
        </label>
        {formError && <p role="alert" className="rounded-xl bg-destructive-surface px-4 py-3 text-sm text-destructive">{formError}</p>}
        <Button className="min-h-14 w-full rounded-xl" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản và nhận 5 credit"}
        </Button>
      </form>
      <p className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-secondary-foreground"><Check aria-hidden="true" size={16} className="mt-0.5 shrink-0" />Bằng việc tạo tài khoản, bạn xác nhận sẽ sử dụng công cụ với biểu mẫu mà mình có quyền vận hành.</p>
      <div className="mt-5">
        <GoogleIdentityButton disabled={isSubmitting} text="signup_with" onCredential={registerWithGoogle} onUnavailable={() => setFormError("Đăng nhập với Google hiện chưa khả dụng. Vui lòng thử lại sau.")} />
      </div>
      <AuthSwitch mode="register" />
    </AuthShell>
  );
}
