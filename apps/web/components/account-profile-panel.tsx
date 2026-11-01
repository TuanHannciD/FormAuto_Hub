"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { apiFetch, type Profile } from "@/lib/api";
import { showError } from "@/lib/toast";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { getStoredSession, saveSession } from "@/lib/auth";

export function AccountProfilePanel() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const requestVersion = useRef(0);

  const loadProfile = useCallback(async () => {
    const version = ++requestVersion.current;
    setIsLoading(true);
    setLoadError(false);
    try {
      const data = await apiFetch<Profile>("/api/profile");
      if (version !== requestVersion.current) return;
      setProfile(data);
      setFullName(data.fullName);
    } catch (error) {
      if (version !== requestVersion.current) return;
      setLoadError(true);
      showError(error, "Không tải được hồ sơ.");
    } finally {
      if (version === requestVersion.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
    return () => { requestVersion.current++; };
  }, [loadProfile]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || isLoading || loadError || isSaving) return;
    setIsSaving(true);
    try {
      const updated = await apiFetch<Profile>("/api/profile", {
        method: "PUT",
        json: { fullName }
      });
      setProfile(updated);
      setFullName(updated.fullName);
      const session = getStoredSession();
      if (session?.userId === updated.id) saveSession({ ...session, fullName: updated.fullName });
      toast.success("Đã lưu hồ sơ.");
    } catch (error) {
      showError(error, "Không lưu được hồ sơ.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {loadError && <Alert><p>Không tải được hồ sơ.</p><Button type="button" variant="secondary" onClick={loadProfile}>Thử lại</Button></Alert>}
      {isLoading && <p role="status" className="text-sm text-muted-foreground">Đang tải hồ sơ...</p>}
      <form className="space-y-4" onSubmit={save}>
        <label className="block text-sm font-medium">
          Email
          <Input className="mt-2" disabled value={profile?.email ?? ""} />
        </label>
        <label className="block text-sm font-medium">
          Họ tên
          <Input className="mt-2 motion-reduce:transition-none" disabled={!profile || isLoading || loadError || isSaving} value={fullName} onChange={(event) => setFullName(event.target.value)} />
        </label>
        <Button className="w-full motion-reduce:transition-none sm:w-auto" disabled={!profile || isLoading || loadError || isSaving} type="submit">{isSaving ? "Đang lưu..." : "Lưu hồ sơ"}</Button>
      </form>
      <p className="border-t border-border pt-3 text-xs text-secondary-foreground">{profile?.role ?? "-"} · Tham gia {formatDate(profile?.createdAt)}</p>
    </div>
  );
}
