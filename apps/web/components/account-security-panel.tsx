"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { GoogleIdentityButton } from "@/components/google-identity-button";
import { Alert, Badge, Button, Input } from "@/components/ui";
import { ApiError, apiFetch, type Profile } from "@/lib/api";
import { SessionExpiredError } from "@/lib/auth";

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

function changePasswordError(error: unknown) {
  if (error instanceof ApiError && error.path === "/api/profile/change-password" && error.status === 400) {
    return "Mật khẩu hiện tại không đúng hoặc mật khẩu mới chưa hợp lệ.";
  }

  return readableError(error, "Không đổi được mật khẩu.");
}

function googleLinkError(error: unknown) {
  if (error instanceof ApiError && error.path === "/api/auth/link-google" && error.method === "POST" && error.status === 409) {
    return "Chỉ có thể liên kết Google khi email Google trùng với email đăng ký và tài khoản chưa link Google.";
  }

  return readableError(error, "Không liên kết được tài khoản Google.");
}

function googleUnlinkError(error: unknown) {
  if (error instanceof ApiError && error.path === "/api/auth/link-google" && error.method === "DELETE" && error.status === 409) {
    return "Hãy thiết lập mật khẩu trước khi hủy liên kết Google để không mất quyền truy cập tài khoản.";
  }

  return readableError(error, "Không hủy liên kết được tài khoản Google.");
}

export function AccountSecurityPanel() {

  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isUnlinkingGoogle, setIsUnlinkingGoogle] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const requestVersion = useRef(0);

  const loadProfile = useCallback(async () => {
    const version = ++requestVersion.current;
    setIsLoadingProfile(true);
    setProfileError(false);
    try {
      const data = await apiFetch<Profile>("/api/profile");
      if (version === requestVersion.current) setProfile(data);
    } catch (error) {
      if (version !== requestVersion.current) return;
      setProfileError(true);
      showError(error, "Không tải được hồ sơ bảo mật.");
    } finally {
      if (version === requestVersion.current) setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
    return () => { requestVersion.current++; };
  }, [loadProfile]);

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || isLoadingProfile || profileError || isSubmitting) return;

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
        toast.error("Mật khẩu hiện tại không đúng hoặc mật khẩu mới chưa hợp lệ.");
      }
    } catch (error) {
      if (!(error instanceof SessionExpiredError)) toast.error(changePasswordError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const linkGoogle = useCallback(
    async (idToken: string) => {
      if (!profile || isLoadingProfile || profileError || isLinkingGoogle || isUnlinkingGoogle) return;
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
        if (!(error instanceof SessionExpiredError)) toast.error(googleLinkError(error));
      } finally {
        setIsLinkingGoogle(false);
      }
    },
    [loadProfile, profile, isLoadingProfile, profileError, isLinkingGoogle, isUnlinkingGoogle]
  );

  const unlinkGoogle = useCallback(async () => {
    if (!profile || isLoadingProfile || profileError || isUnlinkingGoogle || isLinkingGoogle) return;
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
      if (!(error instanceof SessionExpiredError)) toast.error(googleUnlinkError(error));
    } finally {
      setIsUnlinkingGoogle(false);
    }
  }, [loadProfile, profile, isLoadingProfile, profileError, isUnlinkingGoogle, isLinkingGoogle]);


  const googleLinked = profile?.googleLinked === true;
  const profileKnown = Boolean(profile) && !isLoadingProfile && !profileError;

  return (
    <div className="space-y-4">
      {profileError && <Alert><p>Không tải được hồ sơ bảo mật.</p><Button type="button" variant="secondary" onClick={loadProfile}>Thử lại</Button></Alert>}
      {isLoadingProfile && <p role="status" className="text-sm text-muted-foreground">Đang tải hồ sơ bảo mật...</p>}
      <section aria-labelledby="account-password-title">
        <h3 id="account-password-title" className="mb-2 text-[17px] font-bold">Đổi mật khẩu</h3>
        <form className="space-y-3" onSubmit={changePassword}>
          <label className="block text-sm font-medium">
            Mật khẩu hiện tại
            <Input className="mt-2" type="password" disabled={!profileKnown || isSubmitting} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          </label>
          <label className="block text-sm font-medium">
            Mật khẩu mới
            <Input className="mt-2" type="password" disabled={!profileKnown || isSubmitting} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
            <span className="mt-1 block text-xs text-muted-foreground">Mật khẩu tối thiểu 8 ký tự.</span>
          </label>
          <label className="block text-sm font-medium">
            Xác nhận mật khẩu mới
            <Input className="mt-2" type="password" disabled={!profileKnown || isSubmitting} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          </label>
          <Button className="w-full sm:w-auto" type="submit" disabled={!profileKnown || isSubmitting}>{isSubmitting ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}</Button>
        </form>
      </section>
      <section className="space-y-3 border-t border-border pt-3 text-sm" aria-labelledby="account-google-title">
        <h3 id="account-google-title" className="text-[17px] font-bold">Đăng nhập bằng Google</h3>
        <p className="text-secondary-foreground">Dùng Google để đăng nhập FormAuto Hub. Quyền truy cập Google Forms được quản lý riêng trong NCKH.</p>
        <div className="space-y-3 rounded-xl border border-border bg-surface-subtle p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-secondary-foreground">Liên kết</span>
            <Badge tone={profileKnown && googleLinked ? "success" : "warning"}>{!profileKnown ? "Chưa xác định" : googleLinked ? "Đã liên kết" : "Chưa liên kết"}</Badge>
          </div>
          <p className="break-words text-xs text-secondary-foreground">Email hiện tại: <span className="text-foreground">{profile?.email ?? "-"}</span>{profile?.googleEmail && <><br />Google: <span className="text-foreground">{profile.googleEmail}</span></>}</p>
        </div>
        {profileKnown && googleLinked ? (
          <Button className="w-full" type="button" variant="danger" disabled={!profileKnown || isUnlinkingGoogle || isLinkingGoogle} onClick={unlinkGoogle}>{isUnlinkingGoogle ? "Đang hủy liên kết Google..." : "Hủy liên kết Google"}</Button>
        ) : (
          <GoogleIdentityButton disabled={!profileKnown || isLinkingGoogle || isUnlinkingGoogle} text="continue_with" onCredential={linkGoogle} onUnavailable={() => toast.error("Không tải được Google sign-in.")} />
        )}
      </section>
    </div>
  );
}
