"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Input, PageHeader } from "@/components/ui";
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
      <PageHeader title="Hồ sơ" description="Thông tin tài khoản dùng cho bảng điều khiển." />
      <Alert>Phiên hiện tại dùng mã đăng nhập ngắn hạn và mã làm mới. Đổi mật khẩu nằm trong mục bảo mật.</Alert>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tóm tắt tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Detail label="Vai trò" value={profile?.role ?? "-"} />
            <Detail label="Ngày tạo" value={formatDate(profile?.createdAt)} />
            <Detail label="Email đăng nhập" value={profile?.email ?? "-"} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-white/55 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}
