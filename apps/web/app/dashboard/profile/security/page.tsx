"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleIdentityButton } from "@/components/google-identity-button";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, PageHeader } from "@/components/ui";
import { apiFetch, type Profile } from "@/lib/api";
import { logoutCurrentSession } from "@/lib/auth";
import { readableError, showError } from "@/lib/toast";
import { toast } from "sonner";

type ChangePasswordResponse = {
  changed: boolean;
};

type LinkGoogleResponse = {
  linked: boolean;
};

type UnlinkGoogleResponse = {
  unlinked: boolean;
};

function changePasswordError(message: string) {
  if (message.includes("400")) {
    return "Mật khẩu hiện tại không đúng hoặc mật khẩu mới chưa hợp lệ.";
  }

  return readableError(message, "Không đổi được mật khẩu.");
}

function googleLinkError(message: string) {
  if (message.includes("401")) {
    return "Không xác thực được tài khoản Google hoặc email Google chưa được xác minh.";
  }

  if (message.includes("409") || message.toLowerCase().includes("email")) {
    return "Chỉ có thể liên kết Google khi email Google trùng với email đăng ký và tài khoản chưa link Google.";
  }

  return readableError(message, "Không liên kết được tài khoản Google.");
}

function googleUnlinkError(message: string) {
  if (message.includes("409") || message.toLowerCase().includes("password")) {
    return "Hãy thiết lập mật khẩu trước khi hủy liên kết Google để không mất quyền truy cập tài khoản.";
  }

  return readableError(message, "Không hủy liên kết được tài khoản Google.");
}

export default function ProfileSecurityPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isUnlinkingGoogle, setIsUnlinkingGoogle] = useState(false);

  const loadProfile = useCallback(() => {
    apiFetch<Profile>("/api/profile")
      .then(setProfile)
      .catch((error: Error) => showError(error, "Không tải được hồ sơ bảo mật."));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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
      } else {
        toast.error(changePasswordError("400"));
      }
    } catch (error) {
      toast.error(changePasswordError(error instanceof Error ? error.message : ""));
    } finally {
      setIsSubmitting(false);
    }
  }

  const linkGoogle = useCallback(
    async (idToken: string) => {
      setIsLinkingGoogle(true);
      try {
        const result = await apiFetch<LinkGoogleResponse>("/api/auth/link-google", {
          method: "POST",
          json: { idToken }
        });

        if (result.linked) {
          toast.success("Đã liên kết tài khoản Google.");
          loadProfile();
        }
      } catch (error) {
        toast.error(googleLinkError(error instanceof Error ? error.message : ""));
      } finally {
        setIsLinkingGoogle(false);
      }
    },
    [loadProfile]
  );

  const unlinkGoogle = useCallback(async () => {
    setIsUnlinkingGoogle(true);
    try {
      const result = await apiFetch<UnlinkGoogleResponse>("/api/auth/link-google", {
        method: "DELETE"
      });

      if (result.unlinked) {
        toast.success("Đã hủy liên kết tài khoản Google.");
      } else {
        toast.info("Tài khoản chưa liên kết Google.");
      }

      loadProfile();
    } catch (error) {
      toast.error(googleUnlinkError(error instanceof Error ? error.message : ""));
    } finally {
      setIsUnlinkingGoogle(false);
    }
  }, [loadProfile]);

  async function logout() {
    await logoutCurrentSession();
    router.replace("/login");
  }

  const googleLinked = profile?.googleLinked === true;

  return (
    <div className="space-y-6">
      <PageHeader title="Bảo mật tài khoản" description="Quản lý mật khẩu, phiên hiện tại và liên kết đăng nhập." />
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
              <Button className="w-full sm:w-auto" type="submit" disabled={isSubmitting}>
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
              <div className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-white/55 p-3">
                <span className="text-muted-foreground">Trạng thái</span>
                <Badge tone="success">Đang đăng nhập</Badge>
              </div>
              <Button className="w-full" type="button" variant="danger" onClick={logout}>
                Đăng xuất phiên hiện tại
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tài khoản Google</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-3 rounded-md border border-border/70 bg-white/55 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Liên kết</span>
                  <Badge tone={googleLinked ? "success" : "warning"}>{googleLinked ? "Đã liên kết" : "Chưa liên kết"}</Badge>
                </div>
                <div className="break-words text-xs text-muted-foreground">
                  Email hiện tại: <span className="font-medium text-foreground">{profile?.email ?? "-"}</span>
                  {profile?.googleEmail && (
                    <>
                      <br />
                      Google: <span className="font-medium text-foreground">{profile.googleEmail}</span>
                    </>
                  )}
                </div>
              </div>
              {googleLinked ? (
                <Button className="w-full" type="button" variant="danger" disabled={isUnlinkingGoogle} onClick={unlinkGoogle}>
                  {isUnlinkingGoogle ? "Đang hủy liên kết Google..." : "Hủy liên kết Google"}
                </Button>
              ) : (
                <GoogleIdentityButton
                  disabled={isLinkingGoogle || !profile}
                  text="continue_with"
                  onCredential={linkGoogle}
                  onUnavailable={() => toast.error("Không tải được Google sign-in.")}
                />
              )}
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
