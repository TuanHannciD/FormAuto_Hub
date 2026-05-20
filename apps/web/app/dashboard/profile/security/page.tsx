"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { logoutCurrentSession } from "@/lib/auth";
import { readableError } from "@/lib/toast";
import { toast } from "sonner";

type ChangePasswordResponse = {
  changed: boolean;
};

function changePasswordError(message: string) {
  if (message.includes("400")) {
    return "Mật khẩu hiện tại không đúng hoặc mật khẩu mới chưa hợp lệ.";
  }

  return readableError(message, "Không đổi được mật khẩu.");
}

export default function ProfileSecurityPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Mật khẩu tối thiểu 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Xác nhận mật khẩu không khớp.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiFetch<ChangePasswordResponse>("/api/profile/change-password", {
        method: "PUT",
        json: { currentPassword, newPassword }
      });

      if (result.changed) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Đã đổi mật khẩu.");
      }
    } catch (error) {
      toast.error(changePasswordError(error instanceof Error ? error.message : ""));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function logout() {
    await logoutCurrentSession();
    router.replace("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Bảo mật tài khoản</h2>
        <p className="mt-1 text-sm text-muted-foreground">Quản lý mật khẩu, phiên hiện tại và liên kết đăng nhập.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Đổi mật khẩu</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="max-w-xl space-y-4" onSubmit={changePassword}>
              <label className="block text-sm font-medium">
                Mật khẩu hiện tại
                <Input className="mt-2" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
              </label>
              <label className="block text-sm font-medium">
                Mật khẩu mới
                <Input className="mt-2" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
                <span className="mt-1 block text-xs text-muted-foreground">Mật khẩu tối thiểu 8 ký tự.</span>
              </label>
              <label className="block text-sm font-medium">
                Xác nhận mật khẩu mới
                <Input className="mt-2" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
              </label>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Phiên hiện tại</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Trạng thái</span>
                <Badge tone="success">Đang đăng nhập</Badge>
              </div>
              <Button type="button" variant="danger" onClick={logout}>
                Đăng xuất phiên hiện tại
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tài khoản Google</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Liên kết</span>
                <Badge tone="warning">Đang cập nhật</Badge>
              </div>
              <Button type="button" variant="secondary" disabled>
                Liên kết Google đang cập nhật
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Khôi phục mật khẩu</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge tone="warning">Đang cập nhật</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
