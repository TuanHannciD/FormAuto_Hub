"use client";

import { useCallback, useEffect, useState } from "react";

import { GoogleIdentityButton } from "@/components/google-identity-button";
import { Badge, Button, Input } from "@/components/ui";
import { apiFetch, type Profile } from "@/lib/api";

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

export function AccountSecurityPanel() {

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


  const googleLinked = profile?.googleLinked === true;

  return (
    <div className="space-y-4">
      <section aria-labelledby="account-password-title">
        <h3 id="account-password-title" className="mb-2 text-[17px] font-bold">Đổi mật khẩu</h3>
        <form className="space-y-3" onSubmit={changePassword}>
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
          <Button className="w-full sm:w-auto" type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}</Button>
        </form>
      </section>
      <section className="space-y-3 border-t border-border pt-3 text-sm" aria-labelledby="account-google-title">
        <h3 id="account-google-title" className="text-[17px] font-bold">Đăng nhập bằng Google</h3>
        <p className="text-secondary-foreground">Dùng Google để đăng nhập FormAuto Hub. Quyền truy cập Google Forms được quản lý riêng trong NCKH.</p>
        <div className="space-y-3 rounded-xl border border-border bg-surface-subtle p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-secondary-foreground">Liên kết</span>
            <Badge tone={googleLinked ? "success" : "warning"}>{googleLinked ? "Đã liên kết" : "Chưa liên kết"}</Badge>
          </div>
          <p className="break-words text-xs text-secondary-foreground">Email hiện tại: <span className="text-foreground">{profile?.email ?? "-"}</span>{profile?.googleEmail && <><br />Google: <span className="text-foreground">{profile.googleEmail}</span></>}</p>
        </div>
        {googleLinked ? (
          <Button className="w-full" type="button" variant="danger" disabled={isUnlinkingGoogle} onClick={unlinkGoogle}>{isUnlinkingGoogle ? "Đang hủy liên kết Google..." : "Hủy liên kết Google"}</Button>
        ) : (
          <GoogleIdentityButton disabled={isLinkingGoogle || !profile} text="continue_with" onCredential={linkGoogle} onUnavailable={() => toast.error("Không tải được Google sign-in.")} />
        )}
      </section>
    </div>
  );
}
