"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { apiFetch, type AuthTokenResponse } from "@/lib/api";
import { getStoredSession, saveSession } from "@/lib/auth";

function registerErrorMessage(message: string) {
  if (message.includes("409") || message.toLowerCase().includes("already")) {
    return "Email đã tồn tại.";
  }

  if (message.includes("400")) {
    return "Thông tin đăng ký không hợp lệ.";
  }

  return message || "Không tạo được tài khoản.";
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (getStoredSession()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Mật khẩu tối thiểu 8 ký tự.");
      return;
    }

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
      setMessage(registerErrorMessage(error instanceof Error ? error.message : ""));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UserPlus size={20} />
            </div>
            <div>
              <CardTitle>Tạo tài khoản</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Tài khoản mới nhận 5 credit khởi đầu.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            {message && <Alert className="border-red-200 bg-red-50 text-red-800">{message}</Alert>}
            <label className="block text-sm font-medium">
              Họ tên
              <Input className="mt-2" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </label>
            <label className="block text-sm font-medium">
              Email
              <Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="block text-sm font-medium">
              Mật khẩu
              <Input className="mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <span className="mt-1 block text-xs text-muted-foreground">Mật khẩu tối thiểu 8 ký tự.</span>
            </label>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </Button>
          </form>
          <div className="mt-4 space-y-3">
            <Button
              className="w-full"
              type="button"
              variant="secondary"
              onClick={() => router.push("/auth/callback?status=provider-unavailable")}
            >
              Tiếp tục với Google
            </Button>
            <p className="text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link className="text-primary hover:underline" href="/login">
                Đăng nhập
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
