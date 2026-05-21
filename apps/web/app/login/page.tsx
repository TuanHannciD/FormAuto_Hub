"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { apiFetch, type AuthTokenResponse } from "@/lib/api";
import { getStoredSession, saveSession } from "@/lib/auth";
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

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get("reason") === "session-expired") {
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    if (getStoredSession()) {
      router.replace("/dashboard");
    }
  }, [router, searchParams]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
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
      toast.error(authErrorMessage(error instanceof Error ? error.message : ""));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-6 sm:px-5 sm:py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LockKeyhole size={20} />
            </div>
            <div>
              <CardTitle>Đăng nhập</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Vào bảng điều khiển FormAuto Hub.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <label className="block text-sm font-medium">
              Email
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input className="pl-9" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
            </label>
            <label className="block text-sm font-medium">
              Mật khẩu
              <Input className="mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
          <div className="mt-4 space-y-3">
            <Button
              className="w-full"
              type="button"
              variant="secondary"
              onClick={() => router.push("/auth/callback?status=provider-unavailable")}
            >
              Đăng nhập với Google
            </Button>
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <Link className="text-primary hover:underline" href="/register">
                Tạo tài khoản
              </Link>
              <span className="text-muted-foreground">Quên mật khẩu - Đang cập nhật</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
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
