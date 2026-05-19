"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { apiFetch, type Profile } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiFetch<Profile>("/api/profile")
      .then((data) => {
        setProfile(data);
        setFullName(data.fullName);
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const updated = await apiFetch<Profile>("/api/profile", {
        method: "PUT",
        json: { fullName }
      });
      setProfile(updated);
      setMessage("Đã lưu hồ sơ.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không lưu được hồ sơ.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Hồ sơ</h2>
        <p className="mt-1 text-sm text-muted-foreground">Thông tin tài khoản dùng cho dashboard.</p>
      </div>
      <Alert>Phiên hiện tại dùng JWT access token và refresh token. Đổi mật khẩu nằm trong mục bảo mật.</Alert>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="max-w-xl space-y-4" onSubmit={save}>
            <label className="block text-sm font-medium">
              Email
              <Input className="mt-2" disabled value={profile?.email ?? ""} />
            </label>
            <label className="block text-sm font-medium">
              Họ tên
              <Input className="mt-2" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </label>
            <div className="grid gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Role</p>
                <p className="font-medium">{profile?.role ?? "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ngày tạo</p>
                <p className="font-medium">{formatDate(profile?.createdAt)}</p>
              </div>
            </div>
            <Button type="submit">Lưu hồ sơ</Button>
          </form>
          {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
