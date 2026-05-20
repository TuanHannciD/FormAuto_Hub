"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { apiFetch, type Profile } from "@/lib/api";
import { showError } from "@/lib/toast";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function ProfilePage() {
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
      toast.success("Đã lưu hồ sơ.");
    } catch (error) {
      showError(error, "Không lưu được hồ sơ.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Hồ sơ</h2>
        <p className="mt-1 text-sm text-muted-foreground">Thông tin tài khoản dùng cho bảng điều khiển.</p>
      </div>
      <Alert>Phiên hiện tại dùng mã đăng nhập ngắn hạn và mã làm mới. Đổi mật khẩu nằm trong mục bảo mật.</Alert>
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
                <p className="text-muted-foreground">Vai trò</p>
                <p className="font-medium">{profile?.role ?? "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ngày tạo</p>
                <p className="font-medium">{formatDate(profile?.createdAt)}</p>
              </div>
            </div>
            <Button type="submit">Lưu hồ sơ</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
