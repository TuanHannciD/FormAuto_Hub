"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, FileQuestion, FileText, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { DropdownSelect } from "@/components/dropdown-select";
import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, PageHeader, Textarea } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import {
  apiFetch,
  type AnalyzeFormResponse,
  type CreatePayosTopupOrderResponse,
  type CreditPackage,
  type DashboardSummary,
  type FormQuestion,
  type GeneratedResponse,
  type GenerateResponsesResult,
  type SubmissionJob
} from "@/lib/api";
import { showError } from "@/lib/toast";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const modeOptions = [
  { value: "SampleTextLines", label: "Dòng mẫu" },
  { value: "DateRangeSequential", label: "Khoảng ngày tuần tự" },
  { value: "TimeRangeSequential", label: "Khoảng giờ tuần tự" },
  { value: "RandomEqually", label: "Chia đều ngẫu nhiên" },
  { value: "RandomByPercentage", label: "Theo tỷ lệ" },
  { value: "RandomByQuantity", label: "Theo số lượng" }
];

const FORM_URL_MAX_LENGTH = 2048;
const PROJECT_NAME_MAX_LENGTH = 120;
const PREVIEW_COUNT_MIN = 1;
const PREVIEW_COUNT_MAX = 100;
const SUBMISSION_BATCH_SIZE = 10;
const MAX_RULE_VALUES = 10;
const PERCENTAGE_TOTAL = 100;
const MAX_SAMPLE_LINES = 100;
const MAX_SAMPLE_LENGTH = 500;
const TIME_STEP_MIN = 5;
const TIME_STEP_MAX = 120;
const CHECKBOX_SELECTION_MIN = 1;
const FORM_PREVIEW_RESUME_KEY = "formauto.formPreviewResume";
const FORM_PREVIEW_RESUME_CHANNEL = "formauto.formPreviewResume";

type FormPreviewResumeContext = {
  projectId: string;
  analysis: AnalyzeFormResponse;
  ruleConfigs: Record<string, { mode: string; configJson: string }>;
  requestedCount: number;
  generatedCount: number;
  missingCredits: number;
  createdAt: string;
};

export default function FormsPage() {
  const [formUrl, setFormUrl] = useState("");
  const [name, setName] = useState("");
  const [analysis, setAnalysis] = useState<AnalyzeFormResponse | null>(null);
  const [ruleConfigs, setRuleConfigs] = useState<Record<string, { mode: string; configJson: string }>>({});
  const [previewCount, setPreviewCount] = useState(1);
  const [previews, setPreviews] = useState<GeneratedResponse[]>([]);
  const [previewListOpen, setPreviewListOpen] = useState(false);
  const [openPreviews, setOpenPreviews] = useState<Record<string, boolean>>({});
  const [generationCreditNotice, setGenerationCreditNotice] = useState<{ requestedCount: number; generatedCount: number; missingCredits: number } | null>(null);
  const [resumeContext, setResumeContext] = useState<FormPreviewResumeContext | null>(null);
  const [recommendedPackage, setRecommendedPackage] = useState<CreditPackage | null>(null);
  const [resumeCreditReady, setResumeCreditReady] = useState(false);
  const [topupBusy, setTopupBusy] = useState(false);
  const [openRuleEditors, setOpenRuleEditors] = useState<Record<string, boolean>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [submissionLocked, setSubmissionLocked] = useState(false);
  const [submission, setSubmission] = useState<SubmissionJob | null>(null);
  const [submissionLogsOpen, setSubmissionLogsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rulesSectionRef = useRef<HTMLElement | null>(null);
  const previewSectionRef = useRef<HTMLElement | null>(null);

  const canGenerate = useMemo(() => {
    if (!analysis || analysis.questions.length === 0) {
      return false;
    }

    return analysis.questions.every((question) => {
      const config = ruleConfigs[question.id];
      return config?.mode && config.configJson.trim();
    });
  }, [analysis, ruleConfigs]);

  const ruleOpenCount = analysis?.questions.filter((question) => openRuleEditors[question.id] ?? true).length ?? 0;
  const allRuleEditorsOpen = analysis ? ruleOpenCount === analysis.questions.length : false;

  useEffect(() => {
    const stored = readResumeContext();
    if (stored) {
      restoreResumeContext(stored);
      refreshResumeCreditState(stored);
    }

    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(FORM_PREVIEW_RESUME_CHANNEL) : null;
    const handleResumeSignal = () => {
      const next = readResumeContext();
      if (next) {
        restoreResumeContext(next);
        refreshResumeCreditState(next);
        window.focus();
      }
    };

    channel?.addEventListener("message", handleResumeSignal);
    window.addEventListener("storage", handleResumeSignal);
    window.addEventListener("focus", handleResumeSignal);
    document.addEventListener("visibilitychange", handleResumeSignal);

    return () => {
      channel?.removeEventListener("message", handleResumeSignal);
      channel?.close();
      window.removeEventListener("storage", handleResumeSignal);
      window.removeEventListener("focus", handleResumeSignal);
      document.removeEventListener("visibilitychange", handleResumeSignal);
    };
  }, []);

  useEffect(() => {
    if (!resumeContext) {
      setResumeCreditReady(false);
      return;
    }

    refreshResumeCreditState(resumeContext);
  }, [resumeContext]);

  useEffect(() => {
    if (!generationCreditNotice) {
      setRecommendedPackage(null);
      return;
    }

    let active = true;
    apiFetch<CreditPackage[]>("/api/packages")
      .then((packages) => {
        if (!active) {
          return;
        }

        setRecommendedPackage(selectRecommendedPackage(packages, generationCreditNotice.missingCredits));
      })
      .catch(() => {
        if (active) {
          setRecommendedPackage(null);
        }
      });

    return () => {
      active = false;
    };
  }, [generationCreditNotice]);

  useEffect(() => {
    if (submission?.status === "Completed" || submission?.status === "Failed" || submission?.status === "Cancelled") {
      setSubmissionLocked(true);
    }
  }, [submission?.status]);

  async function analyze(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setPreviews([]);
    setPreviewListOpen(false);
    setOpenPreviews({});
    setGenerationCreditNotice(null);
    setResumeContext(null);
    clearResumeContext();
    setSubmission(null);
    setConfirmed(false);
    setSubmissionLocked(false);
    try {
      const result = await apiFetch<AnalyzeFormResponse>("/api/forms/analyze", {
        method: "POST",
        json: { formUrl, name }
      });
      setAnalysis(result);
      setRuleConfigs(Object.fromEntries(result.questions.map((question) => [question.id, defaultRule(question)])));
      setOpenRuleEditors(Object.fromEntries(result.questions.map((question) => [question.id, true])));
      toast.success("Đã phân tích biểu mẫu. Hãy kiểm tra câu hỏi và cài đặt cách trả lời trước khi tạo bản xem trước.");
    } catch (error) {
      showError(error, "Không phân tích được biểu mẫu.");
    } finally {
      setBusy(false);
    }
  }

  async function saveRulesAndGenerate() {
    if (!analysis) {
      return;
    }

    setBusy(true);
    setPreviews([]);
    setPreviewListOpen(false);
    setOpenPreviews({});
    setGenerationCreditNotice(null);
    setSubmission(null);
    setConfirmed(false);
    setSubmissionLocked(false);
    try {
      for (const question of analysis.questions) {
        const config = ruleConfigs[question.id];
        await apiFetch(`/api/projects/${analysis.projectId}/answer-rules`, {
          method: "POST",
          json: {
            questionId: question.id,
            mode: config.mode,
            configJson: config.configJson
          }
        });
      }

      const result = await apiFetch<GenerateResponsesResult>(`/api/projects/${analysis.projectId}/responses/generate`, {
        method: "POST",
        json: { count: previewCount }
      });
      setPreviews(result.items);
      setPreviewListOpen(false);
      setOpenPreviews(Object.fromEntries(result.items.map((preview, index) => [preview.id, index === 0])));
      setGenerationCreditNotice(result.missingCredits > 0
        ? {
            requestedCount: result.requestedCount,
            generatedCount: result.generatedCount,
            missingCredits: result.missingCredits
          }
        : null);
      if (result.missingCredits > 0) {
        const nextContext = {
          projectId: analysis.projectId,
          analysis,
          ruleConfigs,
          requestedCount: result.requestedCount,
          generatedCount: result.generatedCount,
          missingCredits: result.missingCredits,
          createdAt: new Date().toISOString()
        };
        saveResumeContext(nextContext);
        setResumeContext(nextContext);
      } else {
        clearResumeContext();
        setResumeContext(null);
      }
      window.setTimeout(() => {
        previewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      toast.success(`Đã tạo ${result.items.length} câu trả lời xem trước và trừ ${result.creditsUsed} credit.`);
    } catch (error) {
      showError(error, "Không tạo được bản xem trước.");
    } finally {
      setBusy(false);
    }
  }

  async function continueMissingGeneration() {
    const context = resumeContext;
    if (!context) {
      toast.error("Không tìm thấy tiến trình cần tiếp tục.");
      return;
    }

    setBusy(true);
    try {
      const result = await apiFetch<GenerateResponsesResult>(`/api/projects/${context.projectId}/responses/generate`, {
        method: "POST",
        json: { count: context.missingCredits }
      });
      setPreviews((current) => [...current, ...result.items]);
      setPreviewListOpen(false);
      setOpenPreviews((current) => ({
        ...current,
        ...Object.fromEntries(result.items.map((preview, index) => [preview.id, current[preview.id] ?? index === 0]))
      }));
      if (result.missingCredits > 0) {
        const nextContext = {
          ...context,
          requestedCount: context.missingCredits,
          generatedCount: result.generatedCount,
          missingCredits: result.missingCredits,
          createdAt: new Date().toISOString()
        };
        saveResumeContext(nextContext);
        setResumeContext(nextContext);
        setGenerationCreditNotice({
          requestedCount: nextContext.requestedCount,
          generatedCount: nextContext.generatedCount,
          missingCredits: nextContext.missingCredits
        });
      } else {
        clearResumeContext();
        setResumeContext(null);
        setGenerationCreditNotice(null);
      }
      setSubmissionLocked(false);
      window.setTimeout(() => {
        previewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      toast.success(`Đã tạo tiếp ${result.items.length} bản xem trước và trừ ${result.creditsUsed} credit.`);
    } catch (error) {
      showError(error, "Không tạo tiếp được phần còn thiếu.");
    } finally {
      setBusy(false);
    }
  }

  async function createRecommendedTopupLink() {
    if (!generationCreditNotice || !recommendedPackage || !analysis) {
      toast.error("Chưa có gói credit phù hợp để nạp thêm.");
      return;
    }

    const nextContext: FormPreviewResumeContext = {
      projectId: analysis.projectId,
      analysis,
      ruleConfigs,
      requestedCount: generationCreditNotice.requestedCount,
      generatedCount: generationCreditNotice.generatedCount,
      missingCredits: generationCreditNotice.missingCredits,
      createdAt: new Date().toISOString()
    };
    saveResumeContext(nextContext);
    setResumeContext(nextContext);
    setResumeCreditReady(false);

    const checkoutWindow = window.open("about:blank", "_blank");
    setTopupBusy(true);
    try {
      const result = await apiFetch<CreatePayosTopupOrderResponse>("/api/topup-orders/payos", {
        method: "POST",
        json: { packageId: recommendedPackage.id }
      });
      toast.success("Đã tạo liên kết thanh toán PayOS. Sau khi thanh toán, quay lại để tiếp tục tạo phần còn thiếu.");
      if (checkoutWindow) {
        checkoutWindow.location.replace(result.checkoutUrl);
      } else {
        window.location.href = result.checkoutUrl;
      }
    } catch (error) {
      checkoutWindow?.close();
      showError(error, "Không tạo được liên kết PayOS.");
    } finally {
      setTopupBusy(false);
    }
  }

  function restoreResumeContext(context: FormPreviewResumeContext) {
    setResumeContext(context);
    setAnalysis(context.analysis);
    setRuleConfigs(context.ruleConfigs);
    setPreviewCount(context.missingCredits);
    setOpenRuleEditors(Object.fromEntries(context.analysis.questions.map((question) => [question.id, true])));
    setGenerationCreditNotice({
      requestedCount: context.requestedCount,
      generatedCount: context.generatedCount,
      missingCredits: context.missingCredits
    });
  }

  async function refreshResumeCreditState(context: FormPreviewResumeContext) {
    try {
      const summary = await apiFetch<DashboardSummary>("/api/dashboard/summary");
      setResumeCreditReady(summary.currentCreditBalance >= context.missingCredits);
    } catch {
      setResumeCreditReady(false);
    }
  }

  async function submitConfirmed() {
    if (!analysis || previews.length === 0 || !confirmed) {
      toast.error("Bạn phải xem lại bản xem trước và chọn ô xác nhận trước khi gửi.");
      return;
    }

    setBusy(true);
    try {
      const result = await apiFetch<SubmissionJob>(`/api/projects/${analysis.projectId}/submissions/send`, {
        method: "POST",
        json: {
          responseIds: previews.map((preview) => preview.id),
          confirmed: true
        }
      });
      setSubmission(result);
      setSubmissionLocked(result.status === "Completed" || result.status === "Failed");
      setSubmissionLogsOpen(false);
      toast.success("Đã bắt đầu gửi các câu trả lời đã xác nhận.");
    } catch (error) {
      showError(error, "Không gửi được bản xem trước.");
    } finally {
      setBusy(false);
    }
  }

  async function pauseSubmission() {
    if (!analysis || !submission) {
      return;
    }

    setBusy(true);
    try {
      const result = await apiFetch<SubmissionJob>(`/api/projects/${analysis.projectId}/submissions/jobs/${submission.id}/pause`, {
        method: "POST"
      });
      setSubmission(result);
      toast.success("Đã tạm dừng sau nhóm gửi hiện tại.");
    } catch (error) {
      showError(error, "Không tạm dừng được lượt gửi.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelSubmission() {
    if (!analysis || !submission) {
      return;
    }

    setBusy(true);
    try {
      const result = await apiFetch<SubmissionJob>(`/api/projects/${analysis.projectId}/submissions/jobs/${submission.id}/cancel`, {
        method: "POST"
      });
      setSubmission(result);
      toast.success("Đã hủy lượt gửi.");
    } catch (error) {
      showError(error, "Không hủy được lượt gửi.");
    } finally {
      setBusy(false);
    }
  }

  function restartFromAnswerRules() {
    setPreviews([]);
    setPreviewListOpen(false);
    setOpenPreviews({});
    setGenerationCreditNotice(null);
    setResumeContext(null);
    clearResumeContext();
    setResumeCreditReady(false);
    setConfirmed(false);
    setSubmission(null);
    setSubmissionLogsOpen(false);
    setSubmissionLocked(false);
    if (analysis) {
      setOpenRuleEditors(Object.fromEntries(analysis.questions.map((question) => [question.id, true])));
    }
    window.setTimeout(() => {
      rulesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    toast.info("Đã làm mới lượt gửi hiện tại. Cách trả lời cũ vẫn được giữ để tạo bản xem trước mới.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tự động hóa Google Form"
        description="Phân tích biểu mẫu, cài đặt câu trả lời, xem trước và chỉ gửi sau khi xác nhận."
        actions={
        <div className="flex flex-wrap gap-2">
          <Badge tone="info">Tối đa 100 bản xem trước</Badge>
          <Badge tone="neutral">Mỗi lượt gửi {SUBMISSION_BATCH_SIZE}</Badge>
          <Badge tone="success">Cần xác nhận trước khi gửi</Badge>
        </div>
        }
      />

      <Alert className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Không tự gửi hàng loạt. Mỗi lần chỉ tạo tối đa 100 câu trả lời xem trước, gửi tuần tự theo nhóm {SUBMISSION_BATCH_SIZE} và phải xác nhận trước khi gửi.</span>
      </Alert>

      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { label: "1. Phân tích", active: true },
          { label: "2. Cài đặt và xem trước", active: Boolean(analysis) },
          { label: "3. Xác nhận gửi", active: previews.length > 0 }
        ].map((step) => (
          <div
            className={`rounded-md border px-3 py-2 text-sm font-medium ${
              step.active ? "border-primary bg-primary/5 text-primary" : "border-border bg-white text-muted-foreground"
            }`}
            key={step.label}
          >
            {step.label}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Phân tích Google Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]" onSubmit={analyze}>
            <Input
              maxLength={FORM_URL_MAX_LENGTH}
              placeholder="https://docs.google.com/forms/..."
              value={formUrl}
              onChange={(event) => setFormUrl(limitText(event.target.value, FORM_URL_MAX_LENGTH))}
            />
            <Input
              maxLength={PROJECT_NAME_MAX_LENGTH}
              placeholder="Tên nội bộ"
              value={name}
              onChange={(event) => setName(limitText(event.target.value, PROJECT_NAME_MAX_LENGTH))}
            />
            <Button className="w-full lg:w-auto" disabled={busy || !formUrl.trim()} type="submit">Phân tích biểu mẫu</Button>
          </form>
        </CardContent>
      </Card>

      {analysis && (
        <section ref={rulesSectionRef}>
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>2. Câu hỏi và cách trả lời</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Đang mở {ruleOpenCount}/{analysis.questions.length} câu hỏi. Có thể mở từng câu để chỉnh nhanh.
              </p>
            </div>
            <button
              aria-pressed={allRuleEditorsOpen}
              className={`inline-flex min-h-10 items-center justify-between gap-3 rounded-full border px-3 py-2 text-sm font-semibold shadow-sm transition ${
                allRuleEditorsOpen
                  ? "border-cyan-300 bg-cyan-500 text-white"
                  : "border-cyan-200 bg-white text-cyan-800 hover:bg-cyan-50"
              }`}
              type="button"
              onClick={() => {
                const nextOpen = !allRuleEditorsOpen;
                setOpenRuleEditors(Object.fromEntries(analysis.questions.map((question) => [question.id, nextOpen])));
              }}
            >
              <span>{allRuleEditorsOpen ? "Đóng tất cả" : "Mở tất cả"}</span>
              <span className={`relative h-6 w-11 rounded-full transition ${allRuleEditorsOpen ? "bg-white/35" : "bg-cyan-100"}`}>
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${allRuleEditorsOpen ? "left-6" : "left-1"}`} />
              </span>
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Badge tone="info">{analysis.formTitle}</Badge>
                <StatusBadge status={analysis.status} />
                <span className="text-muted-foreground">Tạo lúc {formatDate(analysis.createdAt)}</span>
              </div>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Tên nội bộ</p>
                  <p className="mt-1 font-medium">{analysis.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Số câu hỏi hỗ trợ</p>
                  <p className="mt-1 font-medium">{analysis.questions.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Luồng xử lý</p>
                  <p className="mt-1 font-medium">Cài đặt -&gt; Xem trước -&gt; Xác nhận</p>
                </div>
              </div>
            </div>
            {analysis.questions.length === 0 ? (
              <EmptyState title="Không có câu hỏi được hỗ trợ" detail="Biểu mẫu này chưa có câu hỏi phù hợp với các loại đang hỗ trợ." />
            ) : (
              <div className="space-y-4">
                {analysis.questions.map((question, index) => (
                  <RuleEditor
                    key={question.id}
                    index={index}
                    expanded={openRuleEditors[question.id] ?? true}
                    question={question}
                    value={ruleConfigs[question.id] ?? defaultRule(question)}
                    onChange={(value) => setRuleConfigs((current) => ({ ...current, [question.id]: value }))}
                    onToggle={() => setOpenRuleEditors((current) => ({ ...current, [question.id]: !(current[question.id] ?? true) }))}
                  />
                ))}
                <div className="sticky bottom-3 z-10 flex flex-col gap-4 rounded-lg border border-cyan-200 bg-cyan-50/95 p-4 shadow-soft ring-1 ring-cyan-100 backdrop-blur sm:flex-row sm:items-end sm:justify-between">
                  <div className="w-full sm:w-auto">
                    <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700 shadow-sm">
                      Tạo bản xem trước
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-950">Số câu trả lời xem trước</p>
                    <p className="mt-1 text-xs text-slate-600">Tối thiểu 1, tối đa {PREVIEW_COUNT_MAX} cho mỗi lần tạo.</p>
                    <Input
                      className="mt-2 w-full sm:w-32"
                      inputMode="numeric"
                      max={PREVIEW_COUNT_MAX}
                      min={PREVIEW_COUNT_MIN}
                      step={1}
                      type="number"
                      value={previewCount}
                      onChange={(event) => setPreviewCount(clampInteger(event.target.value, PREVIEW_COUNT_MIN, PREVIEW_COUNT_MAX))}
                    />
                    <p className="mt-2 text-xs font-medium text-cyan-800">
                      Mỗi câu trả lời xem trước tương ứng 1 credit. Khi bấm lưu và tạo bản xem trước, hệ thống sẽ trừ credit theo số lượng đã chọn.
                    </p>
                  </div>
                  <Button className="w-full sm:w-auto" disabled={busy || !canGenerate} onClick={saveRulesAndGenerate} type="button">
                    Lưu và tạo bản xem trước
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </section>
      )}

      <section ref={previewSectionRef}>
        <Card>
          <CardHeader>
            <CardTitle>3. Xem trước và xác nhận</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {previews.length === 0 ? (
              <EmptyState title="Chưa có bản xem trước" detail="Hãy tạo bản xem trước trước khi gửi. Hệ thống sẽ chặn nếu chưa có bản xem trước hoặc chưa xác nhận." />
            ) : (
              <>
              {generationCreditNotice && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm ring-1 ring-amber-100">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">Credit chưa đủ để tạo toàn bộ số lượng đã chọn</p>
                      <p className="mt-1 leading-6 text-amber-900">
                        Bạn yêu cầu {generationCreditNotice.requestedCount} bản xem trước, hệ thống đã tạo {generationCreditNotice.generatedCount} theo số credit hiện có.
                        Còn thiếu {generationCreditNotice.missingCredits} credit để tạo đủ số lượng.
                      </p>
                      {recommendedPackage ? (
                        <p className="mt-2 text-xs font-medium text-amber-900">
                          Gói đề xuất: {recommendedPackage.name} - {recommendedPackage.credits} credit.
                        </p>
                      ) : (
                        <p className="mt-2 text-xs font-medium text-amber-900">
                          Chưa có gói credit phù hợp với số lượng còn thiếu. Vui lòng kiểm tra trang nạp credit.
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      {resumeContext && resumeCreditReady && (
                        <Button className="bg-cyan-600 text-white hover:bg-cyan-700" disabled={busy} type="button" onClick={continueMissingGeneration}>
                          Tiếp tục tạo phần còn thiếu
                        </Button>
                      )}
                      <Button
                        className="bg-amber-500 text-amber-950 hover:bg-amber-400"
                        disabled={!recommendedPackage || topupBusy}
                        type="button"
                        onClick={createRecommendedTopupLink}
                      >
                        {topupBusy ? "Đang tạo link..." : "Nạp thêm credit"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {resumeContext && !generationCreditNotice && (
                <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950 shadow-sm ring-1 ring-cyan-100">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">Có tiến trình tạo preview đang chờ tiếp tục</p>
                      <p className="mt-1 leading-6 text-cyan-900">
                        Hãy bấm tiếp tục để tạo phần còn thiếu sau khi credit đã được cập nhật.
                      </p>
                    </div>
                    <Button disabled={busy} type="button" onClick={continueMissingGeneration}>
                      Tiếp tục tạo phần còn thiếu
                    </Button>
                  </div>
                </div>
              )}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium">Câu trả lời xem trước đã tạo</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Mở từng bản xem trước để kiểm tra câu trả lời trước khi xác nhận gửi.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="info">{previews.length} bản xem trước</Badge>
                    <Badge tone="neutral">{previews.reduce((sum, preview) => sum + preview.answers.length, 0)} câu trả lời</Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-white">
                <button
                  aria-expanded={previewListOpen}
                  className="flex w-full flex-col gap-3 px-4 py-3 text-left transition hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  type="button"
                  onClick={() => setPreviewListOpen((current) => !current)}
                >
                  <span>
                    <span className="block text-sm font-semibold">Danh sách bản xem trước</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {previews.length} bản xem trước, {previews.reduce((sum, preview) => sum + preview.answers.length, 0)} câu trả lời
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2 self-start rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-primary sm:self-auto">
                    {previewListOpen ? "Thu gọn" : "Mở danh sách"}
                    {previewListOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </span>
                </button>
                {previewListOpen && (
                  <div className="space-y-2 border-t border-border p-3">
                    {previews.map((preview, index) => (
                      <PreviewAccordion
                        key={preview.id}
                        index={index}
                        open={openPreviews[preview.id] ?? false}
                        preview={preview}
                        onToggle={() => setOpenPreviews((current) => ({ ...current, [preview.id]: !(current[preview.id] ?? false) }))}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="sticky bottom-3 z-10 rounded-lg border border-cyan-200 bg-cyan-50/95 p-4 shadow-soft ring-1 ring-cyan-100 backdrop-blur">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    checked={confirmed}
                    className="mt-1 h-4 w-4 accent-primary"
                    type="checkbox"
                    onChange={(event) => setConfirmed(event.target.checked)}
                  />
                  <span>
                    <span className="block font-semibold text-slate-950">Xác nhận sau khi xem lại bản xem trước</span>
                    <span className="mt-1 block text-cyan-900">
                      Tôi xác nhận gửi đúng các câu trả lời xem trước này và hiểu hệ thống không hỗ trợ spam, proxy, vượt captcha hoặc gửi khi không được phép.
                    </span>
                  </span>
                </label>
                <div className="mt-4 flex flex-col gap-3 border-t border-cyan-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-medium text-cyan-800">
                    {submissionLocked
                      ? "Lượt gửi này đã hoàn tất. Hãy thực hiện lại bước 2 để tạo bản xem trước mới nếu muốn gửi tiếp."
                      : "Hệ thống chỉ gửi sau khi ô xác nhận được bật."}
                  </p>
                  <Button className="w-full bg-cyan-600 text-white hover:bg-cyan-700 sm:w-auto" disabled={busy || !confirmed || submissionLocked} onClick={submitConfirmed} type="button">
                    {submissionLocked ? "Đã gửi xong" : "Gửi các bản xem trước đã xác nhận"}
                  </Button>
                </div>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {submission && (
        <Card>
          <CardHeader>
            <CardTitle>4. Kết quả gửi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={submission.status} />
              <span>Tổng: {submission.total}</span>
              <span>Thành công: {submission.successCount}</span>
              <span>Thất bại: {submission.failedCount}</span>
            </div>
            {(submission.status === "Running" || submission.status === "Pending") && (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button className="w-full sm:w-auto" disabled={busy} onClick={pauseSubmission} type="button">Tạm dừng</Button>
                <Button className="w-full sm:w-auto" disabled={busy} onClick={cancelSubmission} type="button">Hủy</Button>
              </div>
            )}
            {submission.status === "Paused" && (
              <Button className="w-full sm:w-auto" disabled={busy} onClick={cancelSubmission} type="button">Hủy lượt gửi đang tạm dừng</Button>
            )}
            {(submission.status === "Completed" || submission.status === "Failed" || submission.status === "Cancelled") && (
              <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-cyan-950">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">Thực hiện lại một lần nữa</p>
                    <p className="mt-1 text-xs text-cyan-900">
                      Làm mới bản xem trước, kết quả gửi và trạng thái xác nhận; giữ nguyên cách trả lời đã cài đặt ở bước 2.
                    </p>
                  </div>
                  <Button className="w-full sm:w-auto" disabled={busy} onClick={restartFromAnswerRules} type="button">
                    Thực hiện lại
                  </Button>
                </div>
              </div>
            )}
            <div className="rounded-lg border border-border bg-white">
              <button
                aria-expanded={submissionLogsOpen}
                className="flex w-full flex-col gap-3 px-4 py-3 text-left transition hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                type="button"
                onClick={() => setSubmissionLogsOpen((current) => !current)}
              >
                <span>
                  <span className="block text-sm font-semibold">Chi tiết các lượt gửi</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {buildSubmissionBatches(submission.logs).length} pack, thành công {submission.successCount}, lỗi {submission.failedCount}
                  </span>
                </span>
                <span className="inline-flex items-center gap-2 self-start rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-primary sm:self-auto">
                  {submissionLogsOpen ? "Thu gọn" : "Mở chi tiết"}
                  {submissionLogsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>
              {submissionLogsOpen && (
                <div className="space-y-3 border-t border-border p-3">
                  {buildSubmissionBatches(submission.logs).map((batch, batchIndex) => {
                    const successCount = batch.filter((log) => log.status === "Success").length;
                    const failedCount = batch.length - successCount;
                    return (
                      <div className="rounded-lg border border-border bg-muted/20 p-3" key={`submission-pack-${batchIndex}`}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-semibold">Pack {batchIndex + 1}</p>
                          <div className="flex flex-wrap gap-2 text-xs font-medium">
                            <Badge tone="neutral">Tổng {batch.length}</Badge>
                            <Badge tone="success">Thành công {successCount}</Badge>
                            <Badge tone={failedCount > 0 ? "danger" : "neutral"}>Lỗi {failedCount}</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PreviewAccordion({
  index,
  preview,
  open,
  onToggle
}: {
  index: number;
  preview: GeneratedResponse;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <button
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted/40"
        onClick={onToggle}
        type="button"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-sm font-semibold text-cyan-700">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Bản xem trước #{index + 1}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {preview.answers.length} câu trả lời · {formatDate(preview.createdAt)}
          </span>
        </span>
        <span className="hidden sm:inline-flex"><StatusBadge status={preview.status} /></span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-white text-muted-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className="max-h-[420px] space-y-2 overflow-y-auto border-t border-border bg-muted/30 p-3">
          {preview.answers.map((answer, answerIndex) => (
            <div className="rounded-lg border border-border bg-white px-3 py-3" key={`${preview.id}-${answer.questionId}-${answerIndex}`}>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span className="truncate">{answer.label || "Không có tiêu đề"}</span>
              </div>
              <div className="space-y-1">
                {answer.values.map((value, valueIndex) => (
                  <p className="break-words text-sm font-medium" key={`${preview.id}-${answer.questionId}-${valueIndex}`}>
                    {value || "Không có câu trả lời"}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RuleEditor({
  index,
  expanded,
  question,
  value,
  onChange,
  onToggle
}: {
  index: number;
  expanded: boolean;
  question: FormQuestion;
  value: { mode: string; configJson: string };
  onChange: (value: { mode: string; configJson: string }) => void;
  onToggle: () => void;
}) {
  const isTextQuestion = isFreeTextRuleQuestion(question.questionType);
  const isCheckboxQuestion = question.questionType === "Checkbox";
  const isDateQuestion = question.questionType === "Date";
  const isTimeQuestion = question.questionType === "Time";
  const samples = readSamples(value.configJson);
  const dateRange = readDateRange(value.configJson);
  const timeRange = readTimeRange(value.configJson);
  const selectedOptions = readChoiceValues(question, value.configJson);
  const checkboxSelection = readCheckboxSelection(value.configJson);
  const choiceNumbers = readChoiceNumbers(value.mode, value.configJson, selectedOptions.length > 0 ? selectedOptions : question.options);
  const visibleModes = modeOptions.filter((mode) => {
    if (isDateQuestion) {
      return mode.value === "SampleTextLines" || mode.value === "DateRangeSequential";
    }
    if (isTimeQuestion) {
      return mode.value === "SampleTextLines" || mode.value === "TimeRangeSequential";
    }
    return isTextQuestion
      ? mode.value === "SampleTextLines"
      : mode.value !== "SampleTextLines" && mode.value !== "DateRangeSequential" && mode.value !== "TimeRangeSequential";
  });

  function updateMode(mode: string) {
    onChange({
      mode,
      configJson: defaultConfigForMode(mode, question, selectedOptions.length > 0 ? selectedOptions : question.options, samples, checkboxSelection)
    });
  }

  function updateSamples(text: string) {
    const nextSamples = text
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, MAX_SAMPLE_LINES)
      .map((item) => limitText(item, MAX_SAMPLE_LENGTH));
    onChange({
      mode: "SampleTextLines",
      configJson: JSON.stringify({ samples: nextSamples }, null, 2)
    });
  }

  function toggleOption(option: string) {
    const next = selectedOptions.includes(option)
      ? selectedOptions.filter((item) => item !== option)
      : [...selectedOptions, option];
    onChange({
      mode: value.mode === "SampleTextLines" ? "RandomEqually" : value.mode,
      configJson: buildChoiceConfig(
        value.mode === "SampleTextLines" ? "RandomEqually" : value.mode,
        next.length > 0 ? next : [option],
        question.questionType,
        clampCheckboxSelection(checkboxSelection, next.length > 0 ? next.length : 1)
      )
    });
  }

  function updateChoiceNumber(option: string, rawValue: string) {
    const maxTotal = value.mode === "RandomByPercentage" ? PERCENTAGE_TOTAL : MAX_RULE_VALUES;
    const requestedValue = clampInteger(rawValue, 0, maxTotal);
    const otherTotal = Object.entries(choiceNumbers)
      .filter(([key]) => key !== option)
      .reduce((sum, [, amount]) => sum + clampInteger(amount, 0, maxTotal), 0);
    const numericValue = Math.min(requestedValue, Math.max(0, maxTotal - otherTotal));
    const next = { ...choiceNumbers, [option]: numericValue };
    const activeOptions = Object.keys(next).filter((key) => next[key] > 0);
    onChange({
      mode: value.mode,
      configJson: value.mode === "RandomByPercentage"
        ? buildChoiceNumberConfig("weights", activeOptions, next, question.questionType, checkboxSelection)
        : buildChoiceNumberConfig("quantities", activeOptions, next, question.questionType, checkboxSelection)
    });
  }

  function updateCheckboxSelection(next: { minSelections?: number; maxSelections?: number }) {
    const optionCount = Math.max(1, selectedOptions.length || question.options.length);
    const range = clampCheckboxSelection({ ...checkboxSelection, ...next }, optionCount);
    onChange({
      mode: value.mode,
      configJson: mergeCheckboxSelection(value.configJson, value.mode, selectedOptions.length > 0 ? selectedOptions : question.options, range)
    });
  }

  function updateDateRange(next: { fromDate?: string; toDate?: string }) {
    onChange({
      mode: "DateRangeSequential",
      configJson: JSON.stringify({ ...dateRange, ...next }, null, 2)
    });
  }

  function updateTimeRange(next: { fromTime?: string; toTime?: string; stepMinutes?: number }) {
    onChange({
      mode: "TimeRangeSequential",
      configJson: JSON.stringify({ ...timeRange, ...next }, null, 2)
    });
  }

  const choiceLimit = value.mode === "RandomByPercentage" ? PERCENTAGE_TOTAL : MAX_RULE_VALUES;
  const choiceTotal = Object.values(choiceNumbers).reduce((sum, amount) => sum + clampInteger(amount, 0, choiceLimit), 0);

  return (
    <div className={`rounded-lg border bg-white p-4 transition ${expanded ? "border-border" : "border-cyan-100 shadow-sm"}`}>
      <div className="mb-0 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
            <FileQuestion className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 break-words font-medium">Câu {index + 1}: {question.label}</p>
              <Badge>{questionTypeLabel(question.questionType)}</Badge>
              {question.required && <Badge tone="warning">Bắt buộc</Badge>}
            </div>
            <p className="mt-1 break-all text-xs text-muted-foreground">{question.entryId}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={isTextQuestion ? "neutral" : "info"}>{isTextQuestion ? "Nhập chữ" : `${question.options.length} lựa chọn`}</Badge>
          <button
            aria-expanded={expanded}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition ${
              expanded
                ? "border-border bg-white text-muted-foreground hover:bg-muted/50"
                : "border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
            }`}
            type="button"
            onClick={onToggle}
          >
            {expanded ? "Thu gọn" : "Mở câu hỏi"}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4">

      {!isTextQuestion && question.options.length > 0 && (
        <div className="mb-4 rounded-md border border-border bg-muted/30 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Lựa chọn lấy từ form gốc</p>
          <div className="flex flex-wrap gap-2">
            {question.options.map((option) => {
              const active = selectedOptions.includes(option);
              return (
                <button
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                    active ? "border-cyan-300 bg-cyan-50 text-cyan-800" : "border-border bg-white text-muted-foreground"
                  }`}
                  key={option}
                  onClick={() => toggleOption(option)}
                  type="button"
                >
                  {active && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <label className="block text-sm font-medium">
          <span className="mb-2 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            Chế độ trả lời
          </span>
          <DropdownSelect
            value={value.mode}
            onChange={updateMode}
            options={visibleModes.map((mode) => ({ value: mode.value, label: mode.label }))}
          />
        </label>

        {value.mode === "DateRangeSequential" ? (
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-sm font-medium">Khoảng ngày tuần tự</p>
            <p className="mt-1 text-xs text-muted-foreground">Bản xem trước sẽ lấy lần lượt từ ngày bắt đầu đến ngày kết thúc.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Từ ngày
                <Input
                  className="mt-2"
                  type="date"
                  value={dateRange.fromDate}
                  onChange={(event) => updateDateRange({ fromDate: event.target.value })}
                />
              </label>
              <label className="block text-sm font-medium">
                Đến ngày
                <Input
                  className="mt-2"
                  type="date"
                  value={dateRange.toDate}
                  onChange={(event) => updateDateRange({ toDate: event.target.value })}
                />
              </label>
            </div>
          </div>
        ) : value.mode === "TimeRangeSequential" ? (
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-sm font-medium">Khoảng giờ tuần tự</p>
            <p className="mt-1 text-xs text-muted-foreground">Bản xem trước sẽ lấy lần lượt theo các mốc giờ trong khoảng đã chọn.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block text-sm font-medium">
                Từ giờ
                <Input
                  className="mt-2"
                  type="time"
                  value={timeRange.fromTime}
                  onChange={(event) => updateTimeRange({ fromTime: event.target.value })}
                />
              </label>
              <label className="block text-sm font-medium">
                Đến giờ
                <Input
                  className="mt-2"
                  type="time"
                  value={timeRange.toTime}
                  onChange={(event) => updateTimeRange({ toTime: event.target.value })}
                />
              </label>
              <label className="block text-sm font-medium">
                Bước phút
                <Input
                  className="mt-2"
                  inputMode="numeric"
                  max={TIME_STEP_MAX}
                  min={TIME_STEP_MIN}
                  step={5}
                  type="number"
                  value={timeRange.stepMinutes}
                  onChange={(event) => updateTimeRange({ stepMinutes: clampInteger(event.target.value, TIME_STEP_MIN, TIME_STEP_MAX) })}
                />
              </label>
            </div>
          </div>
        ) : isTextQuestion ? (
          <label className="block text-sm font-medium">
            Dòng trả lời mẫu
            <Textarea
              className="mt-2"
              placeholder="Mỗi dòng là một câu trả lời mẫu"
              value={samples.join("\n")}
              onChange={(event) => updateSamples(event.target.value)}
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Tối đa {MAX_SAMPLE_LINES} dòng, mỗi dòng {MAX_SAMPLE_LENGTH} ký tự.
            </span>
          </label>
        ) : value.mode === "RandomByPercentage" || value.mode === "RandomByQuantity" ? (
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  {value.mode === "RandomByPercentage" ? "Tỷ lệ theo lựa chọn" : "Số lượng theo lựa chọn"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {value.mode === "RandomByPercentage"
                    ? "Nhập phần trăm cho từng lựa chọn. Tổng tối đa 100%."
                    : `Nhập số lớn hơn 0 cho các lựa chọn muốn dùng khi tạo bản xem trước. Tổng tối đa ${MAX_RULE_VALUES}.`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="info">{selectedOptions.length} đang chọn</Badge>
                <Badge tone={choiceTotal === choiceLimit ? "success" : "warning"}>
                  {choiceTotal}/{choiceLimit}{value.mode === "RandomByPercentage" ? "%" : ""}
                </Badge>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {(question.options.length > 0 ? question.options : selectedOptions).map((option) => (
                <label className="grid grid-cols-1 gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm sm:grid-cols-[1fr_120px] sm:items-center sm:gap-3" key={option}>
                  <span className="min-w-0 break-words font-medium sm:truncate">{option}</span>
                  <div className="relative">
                    <Input
                      className={`h-9 min-h-9 text-right ${value.mode === "RandomByPercentage" ? "pr-8" : ""}`}
                      inputMode="numeric"
                      max={choiceLimit}
                      min={0}
                      step={1}
                      type="number"
                      value={choiceNumbers[option] ?? 0}
                      onChange={(event) => updateChoiceNumber(option, event.target.value)}
                    />
                    {value.mode === "RandomByPercentage" && (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {isCheckboxQuestion && (
              <CheckboxSelectionFields
                maxOptionCount={Math.max(1, selectedOptions.length || question.options.length)}
                value={checkboxSelection}
                onChange={updateCheckboxSelection}
              />
            )}
          </div>
        ) : (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
            <p className="font-medium">Cách trả lời sẽ dùng các lựa chọn đang bật.</p>
            <p className="mt-1 text-muted-foreground">
              Với chế độ hiện tại, hệ thống tự tạo cấu hình từ lựa chọn thật của biểu mẫu, không cần nhập JSON thủ công.
            </p>
            {isCheckboxQuestion && (
              <CheckboxSelectionFields
                maxOptionCount={Math.max(1, selectedOptions.length || question.options.length)}
                value={checkboxSelection}
                onChange={updateCheckboxSelection}
              />
            )}
          </div>
        )}
      </div>
      </div>
      )}
    </div>
  );
}

function CheckboxSelectionFields({
  value,
  maxOptionCount,
  onChange
}: {
  value: { minSelections: number; maxSelections: number };
  maxOptionCount: number;
  onChange: (value: { minSelections?: number; maxSelections?: number }) => void;
}) {
  const maxAllowed = Math.min(maxOptionCount, MAX_RULE_VALUES);

  return (
    <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
      <label className="block text-sm font-medium">
        Số lựa chọn tối thiểu
        <Input
          className="mt-2"
          inputMode="numeric"
          max={maxAllowed}
          min={CHECKBOX_SELECTION_MIN}
          step={1}
          type="number"
          value={value.minSelections}
          onChange={(event) => onChange({ minSelections: clampInteger(event.target.value, CHECKBOX_SELECTION_MIN, maxAllowed) })}
        />
      </label>
      <label className="block text-sm font-medium">
        Số lựa chọn tối đa
        <Input
          className="mt-2"
          inputMode="numeric"
          max={maxAllowed}
          min={value.minSelections}
          step={1}
          type="number"
          value={value.maxSelections}
          onChange={(event) => onChange({ maxSelections: clampInteger(event.target.value, value.minSelections, maxAllowed) })}
        />
      </label>
    </div>
  );
}

function defaultRule(question: FormQuestion) {
  if (isFreeTextRuleQuestion(question.questionType)) {
    return {
      mode: "SampleTextLines",
      configJson: JSON.stringify({ samples: defaultSamplesForQuestion(question) }, null, 2)
    };
  }

  const values = question.options.length > 0 ? question.options : ["Lựa chọn A", "Lựa chọn B"];
  return {
    mode: "RandomEqually",
    configJson: buildChoiceConfig("RandomEqually", values, question.questionType)
  };
}

function defaultConfigForMode(
  mode: string,
  question: FormQuestion,
  values: string[],
  currentSamples: string[],
  checkboxSelection: { minSelections: number; maxSelections: number }
) {
  if (mode === "DateRangeSequential") {
    return JSON.stringify({ fromDate: "2026-05-18", toDate: "2026-05-25" }, null, 2);
  }

  if (mode === "TimeRangeSequential") {
    return JSON.stringify({ fromTime: "09:00", toTime: "17:00", stepMinutes: 60 }, null, 2);
  }

  if (mode === "SampleTextLines") {
    return JSON.stringify({ samples: currentSamples.length > 0 ? currentSamples : defaultSamplesForQuestion(question) }, null, 2);
  }

  return buildChoiceConfig(mode, values, question.questionType, checkboxSelection);
}

function defaultSamplesForQuestion(question: FormQuestion) {
  if (question.questionType === "Date") {
    return ["2026-05-18"];
  }

  if (question.questionType === "Time") {
    return ["09:00"];
  }

  return ["Câu trả lời mẫu 1", "Câu trả lời mẫu 2"];
}

function buildChoiceConfig(
  mode: string,
  values: string[],
  questionType?: string,
  checkboxSelection: { minSelections: number; maxSelections: number } = { minSelections: 1, maxSelections: 1 }
) {
  const normalized = values.map((value) => value.trim()).filter(Boolean);
  const limited = normalized.slice(0, MAX_RULE_VALUES);
  const selection = questionType === "Checkbox"
    ? clampCheckboxSelection(checkboxSelection, Math.max(1, limited.length))
    : null;
  if (mode === "RandomByPercentage") {
    const percentages = buildEqualPercentages(limited);
    return JSON.stringify(
      {
        weights: percentages,
        ...(selection ?? {})
      },
      null,
      2
    );
  }

  if (mode === "RandomByQuantity") {
    return JSON.stringify(
      {
        quantities: Object.fromEntries(limited.map((value) => [value, 1])),
        ...(selection ?? {})
      },
      null,
      2
    );
  }

  return JSON.stringify({ values: normalized, ...(selection ?? {}) }, null, 2);
}

function buildEqualPercentages(values: string[]) {
  if (values.length === 0) {
    return {};
  }

  const base = Math.floor(PERCENTAGE_TOTAL / values.length);
  let remainder = PERCENTAGE_TOTAL - base * values.length;
  return Object.fromEntries(
    values.map((value) => {
      const amount = base + (remainder > 0 ? 1 : 0);
      remainder -= 1;
      return [value, amount];
    })
  );
}

function buildChoiceNumberConfig(
  propertyName: "weights" | "quantities",
  activeOptions: string[],
  values: Record<string, number>,
  questionType: string,
  checkboxSelection: { minSelections: number; maxSelections: number }
) {
  const selection = questionType === "Checkbox"
    ? clampCheckboxSelection(checkboxSelection, Math.max(1, activeOptions.length))
    : null;

  return JSON.stringify(
    {
      [propertyName]: Object.fromEntries(activeOptions.map((key) => [key, values[key]])),
      ...(selection ?? {})
    },
    null,
    2
  );
}

function mergeCheckboxSelection(
  configJson: string,
  mode: string,
  values: string[],
  selection: { minSelections: number; maxSelections: number }
) {
  try {
    const parsed = JSON.parse(configJson) as {
      values?: string[];
      weights?: Record<string, number>;
      quantities?: Record<string, number>;
    };
    if (mode === "RandomByPercentage" && parsed.weights) {
      return JSON.stringify({ weights: parsed.weights, ...selection }, null, 2);
    }
    if (mode === "RandomByQuantity" && parsed.quantities) {
      return JSON.stringify({ quantities: parsed.quantities, ...selection }, null, 2);
    }
    return JSON.stringify({ values: parsed.values ?? values, ...selection }, null, 2);
  } catch {
    return JSON.stringify({ values, ...selection }, null, 2);
  }
}

function readSamples(configJson: string) {
  try {
    const parsed = JSON.parse(configJson) as { samples?: string[] };
    return Array.isArray(parsed.samples) ? parsed.samples : [];
  } catch {
    return [];
  }
}

function readDateRange(configJson: string) {
  try {
    const parsed = JSON.parse(configJson) as { fromDate?: string; toDate?: string };
    return {
      fromDate: parsed.fromDate || "2026-05-18",
      toDate: parsed.toDate || "2026-05-25"
    };
  } catch {
    return { fromDate: "2026-05-18", toDate: "2026-05-25" };
  }
}

function readTimeRange(configJson: string) {
  try {
    const parsed = JSON.parse(configJson) as { fromTime?: string; toTime?: string; stepMinutes?: number };
    return {
      fromTime: parsed.fromTime || "09:00",
      toTime: parsed.toTime || "17:00",
      stepMinutes: clampInteger(parsed.stepMinutes ?? 60, TIME_STEP_MIN, TIME_STEP_MAX)
    };
  } catch {
    return { fromTime: "09:00", toTime: "17:00", stepMinutes: 60 };
  }
}

function readChoiceValues(question: FormQuestion, configJson: string) {
  try {
    const parsed = JSON.parse(configJson) as {
      values?: string[];
      weights?: Record<string, number>;
      quantities?: Record<string, number>;
    };
    if (Array.isArray(parsed.values)) {
      return parsed.values;
    }
    if (parsed.weights) {
      return Object.keys(parsed.weights);
    }
    if (parsed.quantities) {
      return Object.keys(parsed.quantities);
    }
  } catch {
    // Use form options below.
  }

  return question.options;
}

function readChoiceNumbers(mode: string, configJson: string, fallbackOptions: string[]) {
  const maxValue = mode === "RandomByPercentage" ? PERCENTAGE_TOTAL : MAX_RULE_VALUES;
  try {
    const parsed = JSON.parse(configJson) as {
      weights?: Record<string, number>;
      quantities?: Record<string, number>;
    };
    const source = mode === "RandomByPercentage" ? parsed.weights : parsed.quantities;
    if (source) {
      return Object.fromEntries(
        Object.entries(source).map(([key, amount]) => [key, clampInteger(amount, 0, maxValue)])
      );
    }
  } catch {
    // Use fallback below.
  }

  return mode === "RandomByPercentage"
    ? buildEqualPercentages(fallbackOptions)
    : Object.fromEntries(fallbackOptions.map((option) => [option, 1]));
}

function readCheckboxSelection(configJson: string) {
  try {
    const parsed = JSON.parse(configJson) as { minSelections?: number; maxSelections?: number };
    return clampCheckboxSelection(
      {
        minSelections: parsed.minSelections ?? 1,
        maxSelections: parsed.maxSelections ?? 1
      },
      MAX_RULE_VALUES
    );
  } catch {
    return { minSelections: 1, maxSelections: 1 };
  }
}

function clampCheckboxSelection(value: { minSelections: number; maxSelections: number }, optionCount: number) {
  const maxAllowed = Math.min(Math.max(1, optionCount), MAX_RULE_VALUES);
  const minSelections = clampInteger(value.minSelections, CHECKBOX_SELECTION_MIN, maxAllowed);
  const maxSelections = clampInteger(value.maxSelections, minSelections, maxAllowed);
  return { minSelections, maxSelections };
}

function clampInteger(value: string | number, min: number, max: number) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.trunc(numericValue)));
}

function limitText(value: string, maxLength: number) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function selectRecommendedPackage(packages: CreditPackage[], missingCredits: number) {
  return packages
    .filter((item) => item.isActive && item.credits >= missingCredits)
    .sort((left, right) => left.credits - right.credits || left.price - right.price)[0] ?? null;
}

function saveResumeContext(context: FormPreviewResumeContext) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FORM_PREVIEW_RESUME_KEY, JSON.stringify(context));
}

function readResumeContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(FORM_PREVIEW_RESUME_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as FormPreviewResumeContext;
  } catch {
    clearResumeContext();
    return null;
  }
}

function clearResumeContext() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(FORM_PREVIEW_RESUME_KEY);
}

function buildSubmissionBatches(logs: SubmissionJob["logs"]) {
  const batches: Array<SubmissionJob["logs"]> = [];
  for (let index = 0; index < logs.length; index += SUBMISSION_BATCH_SIZE) {
    batches.push(logs.slice(index, index + SUBMISSION_BATCH_SIZE));
  }

  return batches;
}

function questionTypeLabel(type: string) {
  switch (type) {
    case "MultipleChoice":
      return "Trắc nghiệm";
    case "Checkbox":
      return "Ô chọn";
    case "Dropdown":
      return "Danh sách chọn";
    case "LinearScale":
      return "Thang điểm";
    case "Rating":
      return "Xếp hạng";
    case "MultipleChoiceGrid":
      return "Lưới trắc nghiệm";
    case "CheckboxGrid":
      return "Lưới ô chọn";
    case "Date":
      return "Ngày";
    case "Time":
      return "Giờ";
    case "ParagraphText":
      return "Đoạn văn";
    case "ShortText":
      return "Trả lời ngắn";
    default:
      return type;
  }
}

function isFreeTextRuleQuestion(type: string) {
  return type === "ShortText" || type === "ParagraphText" || type === "Date" || type === "Time";
}
