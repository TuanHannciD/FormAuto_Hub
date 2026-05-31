"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ExternalLink, FileUp, Link2, Loader2, Search } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { PaginationControls } from "@/components/pagination-controls";
import { apiFetch, type NckhFormItem, type NckhFormListResponse, type NckhImportFormResponse } from "@/lib/api";
import { toast } from "sonner";
import { readableError } from "@/lib/toast";

// ── Google OAuth URL Builder ──────────────────────────────────────

const GOOGLE_OAUTH_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ?? "";
const GOOGLE_OAUTH_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI ?? "";
const GOOGLE_FORMS_SCOPE = "https://www.googleapis.com/auth/forms.body.readonly https://www.googleapis.com/auth/userinfo.email";

function buildGoogleOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
    response_type: "code",
    scope: GOOGLE_FORMS_SCOPE,
    access_type: "offline",
    prompt: "consent"
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ── Main Content ──────────────────────────────────────────────────

function NckhContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [forms, setForms] = useState<NckhFormItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [googleLinked, setGoogleLinked] = useState<boolean | null>(null);
  const [formUrl, setFormUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  // ── Form columns ────────────────────────────────────────────────

  const formColumns: BaseTableColumn<NckhFormItem>[] = [
    {
      key: "title",
      header: "Tiêu đề",
      render: (item) => (
        <button
          className="text-left font-medium text-primary hover:underline"
          onClick={() => router.push(`/dashboard/nckh/forms/${item.id}`)}
          type="button"
        >
          {item.title || "(không tiêu đề)"}
        </button>
      )
    },
    { key: "status", header: "Trạng thái", render: (item) => <StatusBadge status={item.status} /> },
    { key: "questionCount", header: "Số câu hỏi", render: (item) => item.questionCount },
    {
      key: "importedAt",
      header: "Ngày import",
      render: (item) => new Date(item.importedAt).toLocaleDateString("vi-VN")
    }
  ];

  // ── Load forms ──────────────────────────────────────────────────

  const loadForms = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      const data = await apiFetch<NckhFormListResponse>(`/api/v1/nckh/forms?page=${pageNum}&pageSize=20`);
      setForms(data.items);
      setTotalItems(data.totalItems);
      setTotalPages(data.totalPages);
      setPage(data.page);
      setGoogleLinked(true);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      // 401 Unauthorized or any error on forms endpoint when authenticated
      // means Google is likely not linked (or token expired)
      setGoogleLinked(false);
      setForms([]);
      // Only show toast for non-auth errors to avoid noise on initial load
      if (msg && !msg.includes("401") && !msg.toLowerCase().includes("not linked") && !msg.toLowerCase().includes("unauthorized")) {
        toast.error(readableError(msg, "Không tải được danh sách form."));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForms(1);
  }, [loadForms]);

  // ── Handle OAuth callback result ────────────────────────────────

  useEffect(() => {
    const linked = searchParams.get("linked");
    const error = searchParams.get("error");
    if (linked === "true") {
      toast.success("Đã liên kết Google thành công!");
      loadForms(1);
      router.replace("/dashboard/nckh");
    } else if (error) {
      toast.error(decodeURIComponent(error));
      router.replace("/dashboard/nckh");
    }
  }, [searchParams, loadForms, router]);

  // ── Link Google ─────────────────────────────────────────────────

  function handleLinkGoogle() {
    if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_REDIRECT_URI) {
      toast.error("Thiếu cấu hình Google OAuth. Vui lòng kiểm tra biến môi trường.");
      return;
    }
    setIsLinking(true);
    window.location.href = buildGoogleOAuthUrl();
  }

  // ── Import form ─────────────────────────────────────────────────

  async function handleImport(event: React.FormEvent) {
    event.preventDefault();
    if (!formUrl.trim()) return;

    setIsImporting(true);
    try {
      const result = await apiFetch<NckhImportFormResponse>("/api/v1/nckh/forms/import", {
        method: "POST",
        json: { formUrl: formUrl.trim() }
      });
      toast.success(`Đã import form: ${result.title}`);
      setFormUrl("");
      loadForms(page);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("401") || msg.toLowerCase().includes("not linked")) {
        toast.error("Bạn cần liên kết Google trước khi import form.");
        setGoogleLinked(false);
      } else {
        toast.error(readableError(msg, "Không import được form."));
      }
    } finally {
      setIsImporting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">NCKH — Nghiên cứu Khoa học</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý Google Forms khảo sát cho nghiên cứu khoa học.
        </p>
      </div>

      {/* Google Link Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 size={18} />
            Liên kết Google
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {googleLinked === null ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" size={14} />
              Đang kiểm tra trạng thái liên kết...
            </div>
          ) : googleLinked ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-700">Đã liên kết Google — có thể import form.</span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Bạn cần liên kết tài khoản Google để import biểu mẫu khảo sát.
              </p>
              <Button onClick={handleLinkGoogle} disabled={isLinking}>
                {isLinking ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span className="ml-2">Đang chuyển đến Google...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink size={16} />
                    <span className="ml-2">Liên kết Google</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Form */}
      {googleLinked && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileUp size={18} />
              Import Google Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex gap-3" onSubmit={handleImport}>
              <Input
                className="flex-1"
                placeholder="https://docs.google.com/forms/d/..."
                type="url"
                value={formUrl}
                onChange={(event) => setFormUrl(event.target.value)}
                required
              />
              <Button type="submit" disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span className="ml-2">Đang import...</span>
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    <span className="ml-2">Import</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Form List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách form đã import</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin" size={20} />
              <span className="ml-2 text-sm text-muted-foreground">Đang tải...</span>
            </div>
          ) : (
            <>
              <BaseTable
                columns={formColumns}
                items={forms}
                getRowKey={(item) => item.id}
                emptyTitle="Chưa có form nào"
                emptyDetail={googleLinked === false
                  ? "Liên kết Google để import form đầu tiên."
                  : "Dán URL Google Form vào ô trên để import."}
              />
              {forms.length > 0 && (
                <PaginationControls
                  page={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  onPrevious={() => { if (page > 1) loadForms(page - 1); }}
                  onNext={() => { if (page < totalPages) loadForms(page + 1); }}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page Export ──────────────────────────────────────────────────

export default function NckhDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="animate-spin mr-2" size={18} />
          Đang tải NCKH Dashboard...
        </div>
      }
    >
      <NckhContent />
    </Suspense>
  );
}


