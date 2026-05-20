"use client";

import { useEffect, useState } from "react";
import type { ComponentType, FormEvent } from "react";
import { AlertCircle, BookOpen, CheckCircle2, Clipboard, Clock3, KeyRound, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from "@/components/ui";
import { apiFetch, type CheckPayosProviderSettingsResponse, type PayosProviderSettings } from "@/lib/api";
import { showError } from "@/lib/toast";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function PayosSettingsPage() {
  const [settings, setSettings] = useState<PayosProviderSettings | null>(null);
  const [clientId, setClientId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [checksumKey, setChecksumKey] = useState("");
  const [returnUrl, setReturnUrl] = useState("");
  const [cancelUrl, setCancelUrl] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [publicOrigin, setPublicOrigin] = useState("");

  const webhookUrl = publicOrigin ? `${publicOrigin}/api/payments/payos/webhook` : "/api/payments/payos/webhook";

  async function loadData() {
    const data = await apiFetch<PayosProviderSettings>("/api/admin/payment-providers/payos");
    setSettings(data);
    setClientId(data.clientId);
    setReturnUrl(data.returnUrl);
    setCancelUrl(data.cancelUrl);
    setIsEnabled(data.isEnabled);
  }

  useEffect(() => {
    setPublicOrigin(window.location.origin);
    loadData().catch((error: Error) => showError(error, "Không tải được cấu hình PayOS."));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      const data = await apiFetch<PayosProviderSettings>("/api/admin/payment-providers/payos", {
        method: "PUT",
        json: { clientId, apiKey, checksumKey, returnUrl, cancelUrl, isEnabled }
      });
      setSettings(data);
      setApiKey("");
      setChecksumKey("");
      toast.success("Đã lưu cấu hình PayOS. Secret chỉ hiển thị dạng ẩn.");
    } catch (error) {
      showError(error, "Không lưu được cấu hình PayOS.");
    }
  }

  async function check() {
    try {
      const result = await apiFetch<CheckPayosProviderSettingsResponse>("/api/admin/payment-providers/payos/check", { method: "POST" });
      toast.info(result.message);
      await loadData();
    } catch (error) {
      showError(error, "Không kiểm tra được cấu hình PayOS.");
    }
  }

  async function copyWebhookUrl() {
    await navigator.clipboard.writeText(webhookUrl);
    toast.success("Đã sao chép webhook URL để cấu hình trong PayOS dashboard.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Admin / Cấu hình PayOS</p>
          <h2 className="mt-2 text-2xl font-semibold">Cấu hình PayOS</h2>
          <p className="mt-1 text-sm text-muted-foreground">Quản lý trạng thái bật PayOS cho top-up credit tự động.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => loadData().catch((error: Error) => showError(error, "Không tải được cấu hình PayOS."))}>
          <RefreshCw size={16} />
          <span className="ml-2">Làm mới</span>
        </Button>
      </div>
      <Alert className="border-amber-200 bg-amber-50 text-amber-900">
        Không hiển thị API key hoặc checksum key thật trên giao diện. Nếu để trống khóa bí mật khi lưu, hệ thống sẽ giữ khóa hiện có.
      </Alert>
      <Alert className="border-sky-200 bg-sky-50 text-sky-950">
        PayOS cần 3 đường dẫn: Return URL và Cancel URL trỏ về trang frontend bên dưới; Webhook URL cấu hình trong PayOS dashboard và có thể dùng chính domain frontend nhờ proxy `/api/payments/payos/webhook`.
      </Alert>
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.75fr]">
        <div className="space-y-4">
          <Card>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Detail icon={ShieldCheck} label="Trạng thái tích hợp" value={settings?.isEnabled ? "Đang bật" : "Chưa bật"} tone={settings?.isEnabled ? "success" : "warning"} />
              <Detail icon={KeyRound} label="Có API key" value={settings?.hasApiKey ? "Có" : "Chưa"} tone={settings?.hasApiKey ? "success" : "warning"} />
              <Detail icon={Clock3} label="Kiểm tra gần nhất" value={settings?.lastCheckedAt ? formatDate(settings.lastCheckedAt) : "Chưa kiểm tra"} />
            </CardContent>
          </Card>

          <Card>
          <CardHeader>
            <CardTitle>Thông tin kết nối</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={save}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium">
                  Bật PayOS
                  <span className="mt-2 flex min-h-10 items-center justify-between rounded-md border border-border bg-muted/30 px-3">
                    <span className="text-sm text-muted-foreground">Cho phép khách thanh toán qua cổng PayOS.</span>
                    <input checked={isEnabled} onChange={(event) => setIsEnabled(event.target.checked)} type="checkbox" />
                  </span>
                </label>
                <label className="block text-sm font-medium">
                  Môi trường
                  <Select className="mt-2" disabled defaultValue="sandbox">
                    <option value="sandbox">Sandbox</option>
                  </Select>
                </label>
              </div>
              <label className="block text-sm font-medium">
                Client ID
                <Input className="mt-2" value={clientId} onChange={(event) => setClientId(event.target.value)} />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium">
                  API key
                  <Input className="mt-2" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={settings?.apiKeyPreview || "Nhập API key"} />
                </label>
                <label className="block text-sm font-medium">
                  Checksum key
                  <Input className="mt-2" value={checksumKey} onChange={(event) => setChecksumKey(event.target.value)} placeholder={settings?.checksumKeyPreview || "Nhập checksum key"} />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium">
                  Đường dẫn quay lại
                  <Input className="mt-2" value={returnUrl} onChange={(event) => setReturnUrl(event.target.value)} />
                </label>
                <label className="block text-sm font-medium">
                  Đường dẫn hủy
                  <Input className="mt-2" value={cancelUrl} onChange={(event) => setCancelUrl(event.target.value)} />
                </label>
              </div>
              <div className="rounded-md border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">Webhook URL cấu hình trong PayOS dashboard</p>
                    <p className="mt-1 text-sky-800">
                      PayOS gửi POST vào URL này. Next.js sẽ chuyển tiếp payload sang backend API để backend xác minh chữ ký và cộng credit.
                    </p>
                  </div>
                  <Button type="button" variant="secondary" onClick={copyWebhookUrl}>
                    <Clipboard size={16} />
                    <span className="ml-2">Sao chép</span>
                  </Button>
                </div>
                <Input className="mt-3 bg-white font-mono text-xs" readOnly value={webhookUrl} />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  <Save size={16} />
                  <span className="ml-2">Lưu thay đổi</span>
                </Button>
                <Button type="button" variant="secondary" onClick={check}>Kiểm tra cấu hình</Button>
              </div>
            </form>
          </CardContent>
        </Card>
          <Card>
            <CardHeader>
              <CardTitle>Kiểm tra cấu hình</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <CheckRow label="Có Client ID" ok={Boolean(clientId)} />
              <CheckRow label="Có API key" ok={Boolean(settings?.hasApiKey || apiKey)} />
              <CheckRow label="Có Checksum key" ok={Boolean(settings?.hasChecksumKey || checksumKey)} />
              <CheckRow label="Return URL hợp lệ" ok={Boolean(returnUrl)} />
              <CheckRow label="Cancel URL hợp lệ" ok={Boolean(cancelUrl)} />
              <CheckRow label="Webhook proxy FE sẵn sàng" ok={Boolean(publicOrigin)} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
          <CardHeader>
            <CardTitle>Trạng thái</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Detail label="Nhà cung cấp" value="PayOS" />
            <Detail label="Đã có API key" value={settings?.hasApiKey ? "Có" : "Chưa"} />
            <Detail label="Đã có checksum key" value={settings?.hasChecksumKey ? "Có" : "Chưa"} />
            <Detail label="Đang bật" value={settings?.isEnabled ? "Có" : "Chưa"} />
            <Detail label="Lần kiểm tra gần nhất" value={settings?.lastCheckedAt ? formatDate(settings.lastCheckedAt) : "Chưa kiểm tra"} />
            <Detail label="Kết quả kiểm tra" value={settings?.lastCheckMessage || "Chưa có"} />
          </CardContent>
        </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử thay đổi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">Cập nhật gần nhất</p>
              <p className="font-medium">{settings?.updatedAt ? formatDate(settings.updatedAt) : "Chưa có dữ liệu"}</p>
              <p className="text-xs text-muted-foreground">Nhật ký audit chi tiết đang cập nhật.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tài liệu tham khảo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Reference label="PayOS API documentation" />
              <Reference label="Hướng dẫn webhook: dùng URL proxy hiển thị ở form này" />
              <Reference label="Quản lý API key" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  icon: Icon,
  tone = "default"
}: {
  label: string;
  value: string;
  icon?: ComponentType<{ size?: number }>;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass = {
    default: "border-border",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900"
  }[tone];

  return (
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {Icon && <Icon size={15} />}
      </div>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border p-3">
      <span>{label}</span>
      {ok ? <CheckCircle2 className="text-emerald-600" size={16} /> : <AlertCircle className="text-red-600" size={16} />}
    </div>
  );
}

function Reference({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border p-3 text-muted-foreground">
      <BookOpen size={15} />
      <span>{label}</span>
    </div>
  );
}
