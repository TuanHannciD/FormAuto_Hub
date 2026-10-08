"use client";

import { useEffect, useState } from "react";
import { Button, Input } from "@/components/ui";
import { apiFetch, type Profile } from "@/lib/api";
import { showError } from "@/lib/toast";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { getStoredSession, saveSession } from "@/lib/auth";

export function AccountProfilePanel() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    apiFetch<Profile>("/api/profile")
      .then((data) => {
        setProfile(data);
        setFullName(data.fullName);
      })
      .catch((error: Error) => showError(error, "Không tải được hồ sơ."));
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
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
    }
  }

  return (
    <div className="space-y-3">
      <form className="space-y-4" onSubmit={save}>
        <label className="block text-sm font-medium">
          Email
          <Input className="mt-2" disabled value={profile?.email ?? ""} />
        </label>
        <label className="block text-sm font-medium">
          Họ tên
          <Input className="mt-2" value={fullName} onChange={(event) => setFullName(event.target.value)} />
        </label>
        <Button className="w-full sm:w-auto" type="submit">Lưu hồ sơ</Button>
      </form>
      <p className="border-t border-border pt-3 text-xs text-secondary-foreground">{profile?.role ?? "-"} · Tham gia {formatDate(profile?.createdAt)}</p>
    </div>
  );
}
