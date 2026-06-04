"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType, FormEvent } from "react";
import { AlertCircle, Bot, CheckCircle2, Clock3, KeyRound, RefreshCw, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Input, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type AiProviderSettings, type CheckAiProviderSettingsResponse } from "@/lib/api";
import { showError } from "@/lib/toast";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AiProviderSettingsPage() {
  const [settings, setSettings] = useState<AiProviderSettings | null>(null);
  const [provider, setProvider] = useState("OpenAI");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState("gpt-4o-mini");
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const savedModels = useMemo<string[]>(() => settings?.allowedModels.filter(Boolean) ?? [], [settings]);

  async function loadData() {
    setIsLoading(true);
    try {
      const data = await apiFetch<AiProviderSettings>("/api/admin/ai-provider-settings");
      const nextProvider = data.provider || "OpenAI";

      setSettings(data);
      setProvider(nextProvider);
      setBaseUrl(data.baseUrl || "");
      setDefaultModel(data.defaultModel || "");
      setIsEnabled(data.isEnabled);
      setApiKey("");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData().catch((error: Error) => showError(error, "Không tải được cấu hình AI."));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const data = await apiFetch<AiProviderSettings>("/api/admin/ai-provider-settings", {
        method: "PUT",
        json: { provider, apiKey, defaultModel, isEnabled, baseUrl }
      });

      setSettings(data);
      setApiKey("");
      toast.success("Đã lưu cấu hình AI. API key chỉ hiển thị dạng ẩn.");
    } catch (error) {
      showError(error, "Không lưu được cấu hình AI.");
    } finally {
      setIsSaving(false);
    }
  }

  async function check() {
    setIsChecking(true);

    try {
      const result = await apiFetch<CheckAiProviderSettingsResponse>("/api/admin/ai-provider-settings/check", { method: "POST" });
      toast.info(result.message);
      await loadData();
    } catch (error) {
      showError(error, "Không kiểm tra được cấu hình AI.");
    } finally {
      setIsChecking(false);
    }
  }

  const hasPendingApiKey = Boolean(apiKey.trim());
  const hasAnyApiKey = Boolean(settings?.hasApiKey || hasPendingApiKey);
  const hasValidBaseUrl = !baseUrl.trim() || isHttpUrl(baseUrl);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin / Cấu hình AI"
        title="Cấu hình Provider AI"
        description="Quản lý provider, model mặc định và API key server-side cho các luồng AI preview."
        actions={
          <Button type="button" variant="secondary" onClick={() => loadData().catch((error: Error) => showError(error, "Không tải được cấu hình AI."))}>
            <RefreshCw size={16} />
            <span className="ml-2">Làm mới</span>
          </Button>
        }
      />

      <Alert className="border-amber-200/80 bg-amber-50/85 text-amber-900">
        API key thật không được trả về frontend. Nếu để trống API key khi lưu, backend sẽ giữ key hiện có.
      </Alert>
      <Alert className="border-sky-200/80 bg-sky-50/85 text-sky-950">
        Provider, model và API endpoint do admin nhập, được lưu server-side và không cho normal user tự quyết khi generate. Kiểm tra cấu hình không tạo preview, không trừ credit và không gọi luồng submit.
      </Alert>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <Card>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Detail icon={ShieldCheck} label="Trạng thái AI" value={settings?.isEnabled ? "Đang bật" : "Chưa bật"} tone={settings?.isEnabled ? "success" : "warning"} />
              <Detail icon={KeyRound} label="API key" value={settings?.hasApiKey ? settings.apiKeyPreview || "Đã lưu dạng ẩn" : "Chưa có"} tone={settings?.hasApiKey ? "success" : "warning"} />
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
                    Provider
                    <Input
                      autoComplete="off"
                      className="mt-2"
                      disabled={isLoading || isSaving}
                      placeholder="Ví dụ: OpenAI, GoogleAI, Anthropic"
                      value={provider}
                      onChange={(event) => setProvider(event.target.value)}
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Model mặc định
                    <Input
                      autoComplete="off"
                      className="mt-2 font-mono"
                      disabled={isLoading || isSaving}
                      placeholder="Ví dụ: gpt-4o-mini, gemini-1.5-flash"
                      value={defaultModel}
                      onChange={(event) => setDefaultModel(event.target.value)}
                    />
                  </label>
                </div>

                <label className="block text-sm font-medium">
                  API endpoint / Base URL
                  <Input
                    autoComplete="off"
                    className="mt-2 font-mono"
                    disabled={isLoading || isSaving}
                    placeholder="Ví dụ: https://gateway.example.com/v1"
                    value={baseUrl}
                    onChange={(event) => setBaseUrl(event.target.value)}
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Dùng cho OpenAI-compatible gateway. Nếu để trống, backend chỉ lưu provider/model/API key.
                  </span>
                </label>

                <label className="block text-sm font-medium">
                  API key
                  <Input
                    autoComplete="off"
                    className="mt-2 font-mono"
                    disabled={isLoading || isSaving}
                    placeholder={settings?.apiKeyPreview || "Nhập API key"}
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                  />
                </label>

                <label className="block text-sm font-medium">
                  Bật AI provider
                  <span className="mt-2 flex min-h-10 items-start justify-between gap-3 rounded-md border border-border/70 bg-white/55 px-3 py-2 sm:items-center">
                    <span className="text-sm text-muted-foreground">Cho phép luồng AI preview dùng provider/model đã lưu trên server.</span>
                    <input checked={isEnabled} disabled={isLoading || isSaving} onChange={(event) => setIsEnabled(event.target.checked)} type="checkbox" />
                  </span>
                </label>

                <div className="rounded-md border border-cyan-200/80 bg-cyan-50/85 p-4 text-sm text-cyan-950 shadow-sm backdrop-blur">
                  <div className="flex items-start gap-3">
                    <Bot className="mt-0.5 shrink-0 text-primary" size={18} />
                    <div>
                      <p className="font-semibold">Cấu hình này là quyền server-side</p>
                      <p className="mt-1 text-cyan-800">
                        Người dùng thường không được gửi provider, model, API endpoint hoặc API key trong request generate. Backend dùng cấu hình đang bật tại đây.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button disabled={isLoading || isSaving || !defaultModel || !hasValidBaseUrl} type="submit">
                    <Save size={16} />
                    <span className="ml-2">{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
                  </Button>
                  <Button disabled={isLoading || isChecking} type="button" variant="secondary" onClick={check}>
                    <SlidersHorizontal size={16} />
                    <span className="ml-2">{isChecking ? "Đang kiểm tra..." : "Kiểm tra cấu hình"}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Điều kiện tối thiểu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <CheckRow label="Provider đã nhập" ok={Boolean(provider.trim())} />
              <CheckRow label="Model mặc định đã nhập" ok={Boolean(defaultModel.trim())} />
              <CheckRow label="Có API key đã lưu hoặc đang nhập mới" ok={hasAnyApiKey} />
              <CheckRow label="Base URL trống hoặc là URL http/https hợp lệ" ok={hasValidBaseUrl} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Detail label="Provider" value={provider || "Chưa nhập"} />
              <Detail label="Base URL" value={baseUrl || "Không cấu hình"} />
              <Detail label="Model mặc định" value={defaultModel || "Chưa chọn"} />
              <Detail label="Đang bật" value={isEnabled ? "Có" : "Chưa"} />
              <div className="rounded-md border border-border/70 bg-white/55 p-3 shadow-sm backdrop-blur">
                <p className="text-xs text-muted-foreground">Kết quả kiểm tra</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={settings?.lastCheckStatus || "NotChecked"} />
                  <span className="text-sm text-muted-foreground">{settings?.lastCheckedAt ? formatDate(settings.lastCheckedAt) : "Chưa kiểm tra"}</span>
                </div>
                <p className="mt-2 text-sm">{settings?.lastCheckMessage || "Chưa có dữ liệu."}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model đã lưu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(savedModels.length > 0 ? savedModels : [defaultModel].filter(Boolean)).map((model) => (
                <div
                  className={cn(
                    "flex items-center justify-between rounded-md border border-border/70 bg-white/55 p-3",
                    model === defaultModel && "border-cyan-200 bg-cyan-50/80 text-cyan-950"
                  )}
                  key={model}
                >
                  <span className="font-mono text-xs">{model}</span>
                  {model === defaultModel && <CheckCircle2 className="text-emerald-600" size={16} />}
                </div>
              ))}
              {savedModels.length === 0 && !defaultModel && <p className="text-muted-foreground">Chưa có model được lưu.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lịch sử thay đổi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">Cập nhật gần nhất</p>
              <p className="font-medium">{settings?.updatedAt ? formatDate(settings.updatedAt) : "Chưa có dữ liệu"}</p>
              <p className="text-xs text-muted-foreground">Raw provider request/response thuộc AI audit và không hiển thị ở trang này.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function Detail({
  label,
  value,
  icon: Icon,
  tone = "default"
}: {
  label: string;
  value: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass = {
    default: "border-border/70 bg-white/55",
    success: "border-emerald-200 bg-emerald-50/85 text-emerald-900",
    warning: "border-amber-200 bg-amber-50/85 text-amber-900"
  }[tone];

  return (
    <div className={cn("rounded-md border p-3 shadow-sm backdrop-blur", toneClass)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {Icon && <Icon size={15} />}
      </div>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}

function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-white/55 p-3">
      <span>{label}</span>
      {ok ? <CheckCircle2 className="shrink-0 text-emerald-600" size={16} /> : <AlertCircle className="shrink-0 text-red-600" size={16} />}
    </div>
  );
}
