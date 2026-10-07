"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, ChevronDown, ChevronUp, ClipboardPaste, Loader2 } from "lucide-react";
import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import {
  apiFetch,
  type AiGenerateResponsesResult,
  type AiPromptAutoFillResponse,
  type AiPromptProfile,
  type AnalyzeFormResponse,
  type CreatePayosTopupOrderResponse,
  type CreditPackage,
  type DashboardSummary,
  type FormQuestion,
  type GeneratedResponse,
  type GeneratedResponseListResponse,
  type GenerateResponsesResult,
  type SubmissionJob
} from "@/lib/api";
import { getStoredSession } from "@/lib/auth";
import { WorkflowSummary } from "./_components/WorkflowSummary";
import { showError } from "@/lib/toast";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

import type { AiDirectionFields, AiGenerationMode, AiPromptScope, FormPreviewResumeContext, GenerationMode } from "./_types";
import {
  AI_GLOBAL_PROMPT_MAX_LENGTH,
  AI_QUESTION_PROMPT_MAX_LENGTH,
  AI_SHORT_FIELD_MAX_LENGTH,
  DEFAULT_AI_GLOBAL_PROMPT,
  FORM_PREVIEW_RESUME_CHANNEL,
  FORM_URL_MAX_LENGTH,
  PREVIEW_COUNT_MAX,
  PREVIEW_COUNT_MIN,
  PROJECT_NAME_MAX_LENGTH,
  SUBMISSION_BATCH_SIZE,
  defaultAiDirection
} from "./_constants";
import {
  buildAiAudienceJson,
  buildAiAutoFillContext,
  buildSubmissionBatches,
  clampInteger,
  clearResumeContext,
  defaultRule,
  limitText,
  readAiDirection,
  readResumeContext,
  saveResumeContext,
  selectRecommendedPackage,
  toBackendAiMode
} from "./_helpers";
import { AiModePreparationPanel } from "./_components/AiModePreparationPanel";
import { GenerationModeSelector } from "./_components/GenerationModeSelector";
import { PreviewAccordion } from "./_components/PreviewAccordion";
import { RuleEditor } from "./_components/RuleEditor";
// === FILE MAP ===
// loadGeneratedPreviews: load and verify exact response IDs.
// FormsPage state: analysis, rules/AI configuration, preview identity, credit and submission.
// restoreResumeContext / refreshResumeCreditState: recover paid previews and current balance.
// Effects: resume signals, package suggestions and final submission locking.
// analyze / saveRulesAndGenerate: import questions and generate rule previews.
// continueMissingGeneration / createRecommendedTopupLink: partial generation recovery.
// submitConfirmed / pauseSubmission / cancelSubmission: existing submission APIs.
// AI helpers: prompt loading, auto-fill, saving and preview generation.
// Render: five workflow steps with shared shell and WorkflowSummary.

  async function loadGeneratedPreviews(projectId: string, ids: string[]) {
    if (ids.length === 0) {
      return [];
    }

    const searchParams = new URLSearchParams();
    ids.forEach((id) => searchParams.append("ids", id));
    const response = await apiFetch<GeneratedResponseListResponse>(`/api/projects/${projectId}/responses?${searchParams.toString()}`);
    const byId = new Map(response.items.map((preview) => [preview.id, preview]));
    if (ids.some((id) => !byId.has(id))) throw new Error("Không tải đủ các bản xem trước đã lưu. Vui lòng thử lại.");
    return ids.map((id) => byId.get(id)!);
  }

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
  const [generationMode, setGenerationMode] = useState<GenerationMode>("rules");
  const [aiPreviewMode, setAiPreviewMode] = useState<AiGenerationMode | null>(null);
  const [aiQuestionBlocksOpen, setAiQuestionBlocksOpen] = useState<Record<string, boolean>>({});
  const [aiDirection, setAiDirection] = useState<AiDirectionFields>(defaultAiDirection);
  const [aiGlobalPrompt, setAiGlobalPrompt] = useState(DEFAULT_AI_GLOBAL_PROMPT);
  const [aiQuestionPrompts, setAiQuestionPrompts] = useState<Record<string, string>>({});
  const [aiPromptScope, setAiPromptScope] = useState<AiPromptScope>("global");
  const [confirmed, setConfirmed] = useState(false);
  const [submissionLocked, setSubmissionLocked] = useState(false);
  const [submission, setSubmission] = useState<SubmissionJob | null>(null);
  const [submissionLogsOpen, setSubmissionLogsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [previewSnapshot, setPreviewSnapshot] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<{ requestedCount: number; generatedCount: number; creditsUsed: number; balanceAfter: number; partial: boolean } | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const restoredContextRef = useRef<string | null>(null);
  const currentPreviewSnapshot = JSON.stringify({ projectId: analysis?.projectId, generationMode, config: generationMode === "rules" ? ruleConfigs : { aiDirection, aiGlobalPrompt, aiPromptScope, aiQuestionPrompts } });
  const previewStale = previews.length > 0 && previewSnapshot !== currentPreviewSnapshot;

  useEffect(() => { setConfirmed(false); }, [currentPreviewSnapshot]);
  useEffect(() => {
    apiFetch<DashboardSummary>("/api/dashboard/summary").then((value) => setCreditBalance(value.currentCreditBalance)).catch(() => {});
  }, []);
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
  const aiCreditMultiplier = generationMode === "ai-custom" ? 3 : generationMode === "ai-default" ? 2 : 1;
  const canGenerateAi = Boolean(analysis && analysis.questions.length > 0 && generationMode !== "rules" && aiGlobalPrompt.trim());

  const restoreResumeContext = useCallback((context: FormPreviewResumeContext) => {
    if (context.userId !== getStoredSession()?.userId || !context.userId) return;
    if (!context.previewIds || !context.previewSnapshot) return;
    if (restoredContextRef.current === context.createdAt) return;
    restoredContextRef.current = context.createdAt;
    setFormUrl(context.analysis.formUrl);
    setName(context.analysis.name);
    setConfirmed(false);
    setResumeContext(context);
    setAnalysis(context.analysis);
    setRuleConfigs(context.ruleConfigs);
    const contextMode = context.generationMode ?? "rules";
    setGenerationMode(contextMode);
    setPreviewCount(clampInteger(String(context.requestedCount), PREVIEW_COUNT_MIN, PREVIEW_COUNT_MAX));
    setOpenRuleEditors(Object.fromEntries(context.analysis.questions.map((question) => [question.id, true])));
    setAiDirection(context.aiDirection ?? defaultAiDirection);
    setAiGlobalPrompt(context.aiGlobalPrompt ?? DEFAULT_AI_GLOBAL_PROMPT);
    setAiPromptScope(context.aiPromptScope ?? "global");
    setAiQuestionBlocksOpen(Object.fromEntries(context.analysis.questions.map((question) => [question.id, false])));
    setAiQuestionPrompts(context.aiQuestionPrompts ?? Object.fromEntries(context.analysis.questions.map((question) => [question.id, ""])));
    if (context.previewIds?.length) {
      setBusy(true);
      void loadGeneratedPreviews(context.projectId, context.previewIds).then((items) => {
        setPreviews(items);
        setPreviewSnapshot(context.previewSnapshot ?? null);
        setAiPreviewMode(contextMode === "rules" ? null : contextMode);
        setGenerationResult({ requestedCount: context.requestedCount, generatedCount: items.length, creditsUsed: context.creditsUsed ?? 0, balanceAfter: 0, partial: true });
        setSubmissionLocked(items.some((item) => item.status !== "Previewed"));
      }).catch((error) => { restoredContextRef.current = null; showError(error, "Không khôi phục được bản xem trước đã lưu."); }).finally(() => setBusy(false));
    }
    setGenerationCreditNotice({
      requestedCount: context.requestedCount,
      generatedCount: context.generatedCount,
      missingCredits: context.missingCredits
    });
  }, []);

  const refreshResumeCreditState = useCallback(async (context: FormPreviewResumeContext) => {
    try {
      const summary = await apiFetch<DashboardSummary>("/api/dashboard/summary");
      setCreditBalance(summary.currentCreditBalance);
      setResumeCreditReady(summary.currentCreditBalance >= context.missingCredits);
    } catch {
      setResumeCreditReady(false);
    }
  }, []);

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
  }, [restoreResumeContext, refreshResumeCreditState]);

  useEffect(() => {
    if (!resumeContext) {
      setResumeCreditReady(false);
      return;
    }

    refreshResumeCreditState(resumeContext);
  }, [resumeContext, refreshResumeCreditState]);

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

  function clearPreviewWorkflow() {
    setPreviews([]);
    setPreviewSnapshot(null);
    setGenerationResult(null);
    setPreviewListOpen(false);
    setOpenPreviews({});
    setGenerationCreditNotice(null);
    setResumeContext(null);
    clearResumeContext();
    setConfirmed(false);
    setSubmission(null);
    setSubmissionLogsOpen(false);
    setSubmissionLocked(false);
    setAiPreviewMode(null);
  }

  function resetAiPreparation(nextAnalysis: AnalyzeFormResponse) {
    setGenerationMode("rules");
    setAiPreviewMode(null);
    setAiDirection(defaultAiDirection);
    setAiGlobalPrompt(DEFAULT_AI_GLOBAL_PROMPT);
    setAiPromptScope("global");
    setAiQuestionBlocksOpen(Object.fromEntries(nextAnalysis.questions.map((question) => [question.id, false])));
    setAiQuestionPrompts(Object.fromEntries(nextAnalysis.questions.map((question) => [question.id, ""])));
  }

  function selectGenerationMode(mode: GenerationMode) {
    if (mode === generationMode) {
      return;
    }

    setGenerationMode(mode);
    clearPreviewWorkflow();
    if (mode !== "rules") {
      setBusy(true);
      void loadAiPromptProfile(mode).finally(() => setBusy(false));
    }
  }

  function updateFormUrl(value: string) {
    setFormUrl(limitText(value, FORM_URL_MAX_LENGTH));
    setAnalysis(null);
    clearPreviewWorkflow();
  }

  async function pasteFormUrl() {
    setIsPasting(true);
    try {
      const value = (await navigator.clipboard.readText()).trim();
      if (!value) {
        toast.info("Clipboard chưa có nội dung. Hãy sao chép link biểu mẫu trước.");
        return;
      }
      updateFormUrl(value);
    } catch {
      toast.error("Không đọc được clipboard. Bạn có thể dán link bằng Ctrl+V vào ô Link Google Form.");
    } finally {
      setIsPasting(false);
    }
  }

  async function analyze(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    clearPreviewWorkflow();
    setAnalysis(null);
    try {
      const result = await apiFetch<AnalyzeFormResponse>("/api/forms/analyze", {
        method: "POST",
        json: { formUrl, name }
      });
      setAnalysis(result);
      setRuleConfigs(Object.fromEntries(result.questions.map((question) => [question.id, defaultRule(question)])));
      setOpenRuleEditors(Object.fromEntries(result.questions.map((question) => [question.id, true])));
      resetAiPreparation(result);
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
    clearPreviewWorkflow();
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
      setPreviewSnapshot(currentPreviewSnapshot);
      setGenerationResult({ ...result, partial: result.generatedCount < result.requestedCount });
      setCreditBalance(result.balanceAfter);
      setAiPreviewMode(null);
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
          generationMode: "rules" as const,
          requestedCount: result.requestedCount,
          generatedCount: result.generatedCount,
          missingCredits: result.missingCredits,
          previewIds: result.items.map((item) => item.id),
          previewSnapshot: currentPreviewSnapshot,
          creditsUsed: result.creditsUsed,
          userId: getStoredSession()?.userId,
          createdAt: new Date().toISOString()
        };
        saveResumeContext(nextContext);
        restoredContextRef.current = nextContext.createdAt;
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

    if (submissionLocked || previewStale || (context.previewIds?.length && context.previewIds.some((id) => !previews.some((item) => item.id === id)))) {
      toast.error("Hãy khôi phục bản xem trước và giữ cấu hình đã dùng trước khi tạo tiếp.");
      return;
    }
    setBusy(true);
    try {
      const contextMode = context.generationMode ?? "rules";
      const isAiContext = contextMode !== "rules";
      const multiplier = contextMode === "ai-custom" ? 3 : contextMode === "ai-default" ? 2 : 1;
      const continueCount = isAiContext
        ? Math.max(1, Math.ceil(context.missingCredits / multiplier))
        : context.missingCredits;
      const result = isAiContext
        ? await generateAiResponses(context.projectId, contextMode, continueCount)
        : await apiFetch<GenerateResponsesResult>(`/api/projects/${context.projectId}/responses/generate`, {
            method: "POST",
            json: { count: continueCount }
          });
      const resultItems = "items" in result
        ? result.items
        : await loadGeneratedPreviews(context.projectId, result.generatedPreviewIds);
      const allItems = [...previews, ...resultItems];
      const creditsUsed = (context.creditsUsed ?? 0) + result.creditsUsed;
      setPreviews(allItems);
      setConfirmed(false);
      setPreviewSnapshot(context.previewSnapshot ?? currentPreviewSnapshot);
      setGenerationResult({ requestedCount: context.requestedCount, generatedCount: allItems.length, creditsUsed, balanceAfter: result.balanceAfter, partial: allItems.length < context.requestedCount });
      setCreditBalance(result.balanceAfter);
      setAiPreviewMode(isAiContext ? contextMode : null);
      setPreviewListOpen(false);
      setOpenPreviews((current) => ({
        ...current,
        ...Object.fromEntries(resultItems.map((preview, index) => [preview.id, current[preview.id] ?? index === 0]))
      }));
      if (result.missingCredits > 0) {
        const nextContext = {
          ...context,
          requestedCount: context.requestedCount,
          generatedCount: allItems.length,
          previewIds: allItems.map((item) => item.id),
          creditsUsed,
          missingCredits: result.missingCredits,
          createdAt: new Date().toISOString()
        };
        saveResumeContext(nextContext);
        restoredContextRef.current = nextContext.createdAt;
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
      toast.success(`Đã tạo tiếp ${resultItems.length} bản xem trước và trừ ${result.creditsUsed} credit.`);
    } catch (error) {
      showError(error, "Không tạo tiếp được phần còn thiếu.");
    } finally {
      setBusy(false);
    }
  }

  async function createRecommendedTopupLink() {
    if (previewStale || submissionLocked || !generationCreditNotice || !recommendedPackage || !analysis) {
      toast.error("Chưa có gói credit phù hợp để nạp thêm.");
      return;
    }

    const nextContext: FormPreviewResumeContext = {
      projectId: analysis.projectId,
      analysis,
      ruleConfigs,
      generationMode,
      aiDirection,
      aiGlobalPrompt,
      aiPromptScope,
      aiQuestionPrompts,
      previewIds: previews.map((item) => item.id),
      previewSnapshot: previewSnapshot ?? undefined,
      creditsUsed: generationResult?.creditsUsed,
      userId: getStoredSession()?.userId,
      requestedCount: generationCreditNotice.requestedCount,
      generatedCount: generationCreditNotice.generatedCount,
      missingCredits: generationCreditNotice.missingCredits,
      createdAt: new Date().toISOString()
    };
    saveResumeContext(nextContext);
    restoredContextRef.current = nextContext.createdAt;
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

  async function submitConfirmed() {
    if (!analysis || previews.length === 0 || !confirmed || previewStale || submissionLocked) {
      toast.error("Bạn phải xem lại bản xem trước và chọn ô xác nhận trước khi gửi.");
      return;
    }

    setBusy(true);
    setIsSending(true);
    try {
      const result = await apiFetch<SubmissionJob>(`/api/projects/${analysis.projectId}/submissions/send`, {
        method: "POST",
        json: {
          responseIds: previews.map((preview) => preview.id),
          confirmed: true
        }
      });
      setSubmission(result);
      clearResumeContext();
      setResumeContext(null);
      setGenerationCreditNotice(null);
      setSubmissionLocked(result.status === "Completed" || result.status === "Failed");
      setSubmissionLogsOpen(false);
      if (result.status === "Completed") toast.success(`Đã gửi thành công ${result.successCount} lượt.`);
      else toast.info(`Lượt gửi kết thúc: ${result.successCount} thành công, ${result.failedCount} lỗi.`);
    } catch (error) {
      showError(error, "Không gửi được bản xem trước.");
    } finally {
      setIsSending(false);
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
    clearPreviewWorkflow();
    setResumeCreditReady(false);
    if (analysis) {
      setOpenRuleEditors(Object.fromEntries(analysis.questions.map((question) => [question.id, true])));
    }
    window.setTimeout(() => {
      rulesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    toast.info("Đã làm mới lượt gửi hiện tại. Cách trả lời cũ vẫn được giữ để tạo bản xem trước mới.");
  }

  async function loadAiPromptProfile(mode: AiGenerationMode) {
    if (!analysis) {
      return;
    }

    try {
      const profile = await apiFetch<AiPromptProfile>(`/api/projects/${analysis.projectId}/ai-prompt-profile?mode=${toBackendAiMode(mode)}`);
      setAiGlobalPrompt(profile.globalPrompt || DEFAULT_AI_GLOBAL_PROMPT);
      setAiDirection(readAiDirection(profile.audienceJson));
      setAiQuestionPrompts({
        ...Object.fromEntries(analysis.questions.map((question) => [question.id, ""])),
        ...Object.fromEntries(profile.questions.map((question) => [question.questionId, question.prompt]))
      });
      setAiPromptScope(profile.questions.some((question) => question.useAi) ? "per-question" : "global");
    } catch {
      setAiDirection(defaultAiDirection);
      setAiGlobalPrompt(DEFAULT_AI_GLOBAL_PROMPT);
      setAiPromptScope("global");
      setAiQuestionPrompts(Object.fromEntries(analysis.questions.map((question) => [question.id, ""])));
    }
  }

  async function autoFillAiPrompt() {
    if (!analysis || generationMode === "rules") {
      return;
    }

    setBusy(true);
    try {
      const context = buildAiAutoFillContext(generationMode, aiDirection);
      const response = await apiFetch<AiPromptAutoFillResponse>(`/api/projects/${analysis.projectId}/ai-prompt-profile/auto-fill`, {
        method: "POST",
        json: {
          mode: toBackendAiMode(generationMode),
          context
        }
      });
      setAiGlobalPrompt(response.globalPrompt || DEFAULT_AI_GLOBAL_PROMPT);
      setAiQuestionPrompts({
        ...Object.fromEntries(analysis.questions.map((question) => [question.id, ""])),
        ...Object.fromEntries(response.questions.map((question) => [question.questionId, question.prompt]))
      });
      if (generationMode === "ai-custom") {
        setAiPromptScope("per-question");
      }
      toast.success("Đã điền gợi ý prompt miễn phí. Prompt sẽ được lưu khi tạo AI preview.");
    } catch (error) {
      showError(error, "Không điền được prompt AI.");
    } finally {
      setBusy(false);
    }
  }

  async function saveAiPromptProfile(mode: AiGenerationMode) {
    if (!analysis) {
      return;
    }

    const backendMode = toBackendAiMode(mode);
    await apiFetch<AiPromptProfile>(`/api/projects/${analysis.projectId}/ai-prompt-profile`, {
      method: "PUT",
      json: {
        mode: backendMode,
        audienceJson: buildAiAudienceJson(mode, aiDirection),
        globalPrompt: aiGlobalPrompt
      }
    });

    if (mode !== "ai-custom") {
      return;
    }

    for (const question of analysis.questions) {
      await apiFetch(`/api/projects/${analysis.projectId}/ai-prompt-profile/questions/${question.id}`, {
        method: "PUT",
        json: {
          mode: backendMode,
          prompt: aiQuestionPrompts[question.id] ?? "",
          useAi: aiPromptScope === "per-question"
        }
      });
    }
  }

  async function generateAiResponses(projectId: string, mode: AiGenerationMode, count: number) {
    return apiFetch<AiGenerateResponsesResult>(`/api/projects/${projectId}/ai-responses/generate`, {
      method: "POST",
      json: {
        mode: toBackendAiMode(mode),
        count
      }
    });
  }

  async function createAiPreviews() {
    if (!analysis || generationMode === "rules") {
      return;
    }

    setBusy(true);
    clearPreviewWorkflow();
    try {
      await saveAiPromptProfile(generationMode);
      const result = await generateAiResponses(analysis.projectId, generationMode, previewCount);
      const resultItems = await loadGeneratedPreviews(analysis.projectId, result.generatedPreviewIds);
      setPreviews(resultItems);
      setPreviewSnapshot(currentPreviewSnapshot);
      setGenerationResult({ ...result, partial: result.generatedCount < result.requestedCount });
      setCreditBalance(result.balanceAfter);
      setAiPreviewMode(generationMode);
      setPreviewListOpen(false);
      setOpenPreviews(Object.fromEntries(resultItems.map((preview, index) => [preview.id, index === 0])));
      setGenerationCreditNotice(result.missingCredits > 0
        ? {
            requestedCount: result.requestedCount,
            generatedCount: result.generatedCount,
            missingCredits: result.missingCredits
          }
        : null);
      if (result.missingCredits > 0) {
        const nextContext: FormPreviewResumeContext = {
          projectId: analysis.projectId,
          analysis,
          ruleConfigs,
          generationMode,
          aiDirection,
          aiGlobalPrompt,
          aiPromptScope,
          aiQuestionPrompts,
          requestedCount: result.requestedCount,
          generatedCount: result.generatedCount,
          missingCredits: result.missingCredits,
          previewIds: result.generatedPreviewIds,
          previewSnapshot: currentPreviewSnapshot,
          creditsUsed: result.creditsUsed,
          userId: getStoredSession()?.userId,
          createdAt: new Date().toISOString()
        };
        saveResumeContext(nextContext);
        restoredContextRef.current = nextContext.createdAt;
        setResumeContext(nextContext);
      } else {
        clearResumeContext();
        setResumeContext(null);
      }
      window.setTimeout(() => {
        previewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      if (result.status === "Failed") {
        toast.error("AI chưa tạo được bản xem trước hợp lệ. Không trừ credit.");
      } else {
        toast.success(`Đã tạo ${resultItems.length} AI preview và trừ ${result.creditsUsed} credit.`);
      }
    } catch (error) {
      showError(error, "Không tạo được AI preview.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tự động hóa biểu mẫu" description="Chuẩn bị câu trả lời cho biểu mẫu bạn có quyền vận hành, xem lại rồi xác nhận gửi." />
      <nav aria-label="Các bước tự động hóa" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {["Chọn form", "Cấu hình", "Preview", "Xác nhận gửi", "Kết quả"].map((label, index) => {
          const enabled = index === 0 || (index <= 2 && Boolean(analysis)) || (index === 3 && previews.length > 0) || (index === 4 && Boolean(submission));
          const currentStep = submission ? 4 : previews.length > 0 && !previewStale ? (confirmed ? 3 : 2) : analysis ? 1 : 0;
          const content = <><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">{index + 1}</span>{label}</>;
          const className = `flex min-h-12 items-center gap-2 rounded-xl border px-3 text-xs font-semibold ${index === currentStep ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-muted-foreground"}`;
          return enabled ? <a key={label} aria-current={index === currentStep ? "step" : undefined} href={`#workflow-step-${index + 1}`} className={`${className} hover:border-primary hover:text-primary`}>{content}</a> : <span key={label} aria-disabled="true" className={`${className} opacity-60`}>{content}</span>;
        })}
      </nav>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
      <fieldset disabled={busy || topupBusy || isPasting} className="isolate m-0 min-w-0 space-y-6 border-0 p-0">
      <Card id="workflow-step-1" className="scroll-mt-24 rounded-2xl bg-surface shadow-none">
        <CardHeader>
          <CardTitle>1. Chọn và phân tích form</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end" onSubmit={analyze}>
            <label className="grid min-w-0 gap-2 text-sm font-semibold">Link Google Form<Input
              maxLength={FORM_URL_MAX_LENGTH}
              type="url"
              required
              placeholder="https://docs.google.com/forms/..."
              value={formUrl}
              onChange={(event) => updateFormUrl(event.target.value)}
            /></label>
            <Button className="w-full gap-2" disabled={busy || isPasting} onClick={pasteFormUrl} type="button" variant="secondary">
              <ClipboardPaste aria-hidden="true" size={16} />{isPasting ? "Đang dán..." : "Dán link"}
            </Button>
            <label className="grid min-w-0 gap-2 text-sm font-semibold">Tên nội bộ (không bắt buộc)<Input
              maxLength={PROJECT_NAME_MAX_LENGTH}
              placeholder="Tên nội bộ"
              value={name}
              onChange={(event) => setName(limitText(event.target.value, PROJECT_NAME_MAX_LENGTH))}
            /></label>
            <Button className="w-full" disabled={busy || isPasting || !formUrl.trim()} type="submit">Phân tích biểu mẫu</Button>
          </form>
        </CardContent>
      </Card>

      {analysis && (
        <section id="workflow-step-2" className="scroll-mt-24" ref={rulesSectionRef}>
        <Card className="rounded-2xl bg-surface shadow-none">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>2. Câu hỏi và cách trả lời</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {generationMode === "rules"
                  ? `Đang mở ${ruleOpenCount}/${analysis.questions.length} câu hỏi. Có thể mở từng câu để chỉnh nhanh.`
                  : "AI tạo câu trả lời theo hướng dẫn của bạn. Chỉ trừ credit cho bản xem trước hợp lệ đã lưu."}
              </p>
            </div>
            {generationMode === "rules" && (
              <button
                aria-pressed={allRuleEditorsOpen}
                className={`inline-flex min-h-10 items-center justify-between gap-3 rounded-full border px-3 py-2 text-sm font-semibold shadow-sm transition ${
                  allRuleEditorsOpen
                    ? "border-info-border bg-accent text-inverse-foreground"
                    : "border-info-border bg-surface text-info hover:bg-info-surface"
                }`}
                type="button"
                onClick={() => {
                  const nextOpen = !allRuleEditorsOpen;
                  setOpenRuleEditors(Object.fromEntries(analysis.questions.map((question) => [question.id, nextOpen])));
                }}
              >
                <span>{allRuleEditorsOpen ? "Đóng tất cả" : "Mở tất cả"}</span>
                <span className={`relative h-6 w-11 rounded-full transition ${allRuleEditorsOpen ? "bg-surface/35" : "bg-info-surface"}`}>
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-surface shadow transition ${allRuleEditorsOpen ? "left-6" : "left-1"}`} />
                </span>
              </button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/70 bg-surface/55 p-4 backdrop-blur">
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
            <GenerationModeSelector value={generationMode} onChange={selectGenerationMode} />
            {analysis.questions.length === 0 ? (
              <EmptyState title="Không có câu hỏi được hỗ trợ" detail="Biểu mẫu này chưa có câu hỏi phù hợp với các loại đang hỗ trợ." />
            ) : generationMode !== "rules" ? (
              <AiModePreparationPanel
                aiDirection={aiDirection}
                aiGlobalPrompt={aiGlobalPrompt}
                aiPromptScope={aiPromptScope}
                aiQuestionBlocksOpen={aiQuestionBlocksOpen}
                aiQuestionPrompts={aiQuestionPrompts}
                busy={busy}
                canGenerate={canGenerateAi}
                mode={generationMode}
                multiplier={aiCreditMultiplier}
                previewCount={previewCount}
                questions={analysis.questions}
                onAutoFill={autoFillAiPrompt}
                onDirectionChange={(key, value) => setAiDirection((current) => ({ ...current, [key]: limitText(value, AI_SHORT_FIELD_MAX_LENGTH) }))}
                onGenerate={createAiPreviews}
                onGlobalPromptChange={(value) => setAiGlobalPrompt(limitText(value, AI_GLOBAL_PROMPT_MAX_LENGTH))}
                onPreviewCountChange={(value) => setPreviewCount(value)}
                onPromptScopeChange={setAiPromptScope}
                onQuestionPromptChange={(questionId, value) => setAiQuestionPrompts((current) => ({ ...current, [questionId]: limitText(value, AI_QUESTION_PROMPT_MAX_LENGTH) }))}
                onToggleQuestion={(questionId) => setAiQuestionBlocksOpen((current) => ({ ...current, [questionId]: !(current[questionId] ?? false) }))}
              />
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
                <div className="sticky bottom-3 z-[200] flex flex-col gap-4 rounded-lg border border-info-border/80 bg-info-surface/88 p-4 shadow-soft ring-1 ring-info-border/70 backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between">
                  <div className="w-full sm:w-auto">
                    <div className="inline-flex rounded-full bg-surface px-3 py-1 text-xs font-semibold text-info shadow-sm">
                      Tạo bản xem trước
                    </div>
                    <p className="mt-3 text-sm font-semibold text-foreground">Số câu trả lời xem trước</p>
                    <p className="mt-1 text-xs text-secondary-foreground">Tối thiểu 1, tối đa {PREVIEW_COUNT_MAX} cho mỗi lần tạo.</p>
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
                    <p className="mt-2 text-xs font-medium text-info">
                      Mỗi bản xem trước là một bộ câu trả lời cho cả biểu mẫu. Chỉ trừ 1 credit cho mỗi bản được tạo và lưu thành công.
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

      <section id="workflow-step-3" className="scroll-mt-24" ref={previewSectionRef}>
        <Card className="rounded-2xl bg-surface shadow-none">
          <CardHeader>
            <CardTitle>3. Xem trước · 4. Xác nhận gửi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewStale && <Alert role="alert" className="border-warning-border bg-warning-surface text-warning">Cấu hình đã thay đổi. Các preview dưới đây thuộc cấu hình trước; hãy tạo lại và xác nhận lại trước khi gửi.</Alert>}
            {generationResult && <div role="status" className="rounded-xl border border-border bg-surface-subtle p-4 text-sm leading-6">Đã tạo {generationResult.generatedCount}/{generationResult.requestedCount} bản xem trước · Đã trừ {generationResult.creditsUsed} credit.{generationResult.partial && !generationCreditNotice ? " Chưa tạo đủ số lượng yêu cầu; hãy kiểm tra kết quả trước khi tạo thêm." : ""}</div>}
            {isSending && <Alert role="status" className="flex items-center gap-3"><Loader2 aria-hidden="true" className="animate-spin shrink-0" size={20} />Đang gửi các preview đã xác nhận. Vui lòng chờ kết quả, không đóng hoặc tải lại trang.</Alert>}
              {generationCreditNotice && (
                <div className="rounded-lg border border-warning-border bg-warning-surface p-4 text-sm text-warning shadow-sm ring-1 ring-warning-border">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">Credit chưa đủ để tạo toàn bộ số lượng đã chọn</p>
                      <p className="mt-1 leading-6 text-warning">
                        Đã tạo {generationCreditNotice.generatedCount}/{generationCreditNotice.requestedCount} bản xem trước hợp lệ.
                        Theo số dư, yêu cầu tạo còn thiếu {generationCreditNotice.missingCredits} credit.
                        {generationMode !== "rules" && " AI có thể tạo ít hơn yêu cầu nếu câu trả lời không hợp lệ."}
                      </p>
                      {recommendedPackage ? (
                        <p className="mt-2 text-xs font-medium text-warning">
                          Gói đề xuất: {recommendedPackage.name} - {recommendedPackage.credits} credit.
                        </p>
                      ) : (
                        <p className="mt-2 text-xs font-medium text-warning">
                          Chưa có gói credit phù hợp với số lượng còn thiếu. Vui lòng kiểm tra trang nạp credit.
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      {resumeContext && resumeCreditReady && (
                        <Button className="bg-primary text-inverse-foreground hover:bg-primary" disabled={busy || previewStale || submissionLocked} type="button" onClick={continueMissingGeneration}>
                          Tiếp tục tạo phần còn thiếu
                        </Button>
                      )}
                      <Button
                        className="bg-warning text-inverse-foreground hover:bg-warning/90"
                        disabled={!recommendedPackage || topupBusy || previewStale || submissionLocked}
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
                <div className="rounded-lg border border-info-border/80 bg-info-surface/85 p-4 text-sm text-info shadow-sm ring-1 ring-info-border/70 backdrop-blur">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">Có tiến trình tạo preview đang chờ tiếp tục</p>
                      <p className="mt-1 leading-6 text-info">
                        Hãy bấm tiếp tục để tạo phần còn thiếu sau khi credit đã được cập nhật.
                      </p>
                    </div>
                    <Button disabled={busy || previewStale || submissionLocked} type="button" onClick={continueMissingGeneration}>
                      Tiếp tục tạo phần còn thiếu
                    </Button>
                  </div>
                </div>
              )}
            {previews.length === 0 ? (
              <EmptyState title="Chưa có bản xem trước" detail="Hãy tạo bản xem trước trước khi gửi. Hệ thống sẽ chặn nếu chưa có bản xem trước hoặc chưa xác nhận." />
            ) : (
              <>
              <div className="rounded-lg border border-border/70 bg-surface/55 p-4 backdrop-blur">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium">Câu trả lời xem trước đã tạo</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Mở từng bản xem trước để kiểm tra câu trả lời trước khi xác nhận gửi.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiPreviewMode && <Badge tone="info">AI {aiPreviewMode === "ai-custom" ? "tùy chỉnh" : "mặc định"}</Badge>}
                    {aiPreviewMode && <Badge tone="warning">Chỉ đọc</Badge>}
                    <Badge tone="info">{previews.length} bản xem trước</Badge>
                    <Badge tone="neutral">{previews.reduce((sum, preview) => sum + preview.answers.length, 0)} câu trả lời</Badge>
                  </div>
                </div>
                {aiPreviewMode && (
                  <div className="mt-3 rounded-md border border-info-border bg-info-surface/80 px-3 py-2 text-xs font-medium text-info">
                    Bản xem trước AI chỉ đọc. Hãy kiểm tra nội dung trước khi xác nhận gửi.
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-lg border border-border/70 bg-surface/72 shadow-sm backdrop-blur">
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
                  <span className="inline-flex items-center gap-2 self-start rounded-md border border-border/70 bg-surface/80 px-2.5 py-1.5 text-xs font-semibold text-primary sm:self-auto">
                    {previewListOpen ? "Thu gọn" : "Mở danh sách"}
                    {previewListOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </span>
                </button>
                {previewListOpen && (
                  <div className="space-y-2 border-t border-border/70 p-3">
                    {previews.map((preview, index) => (
                      <PreviewAccordion
                        key={preview.id}
                        index={index}
                        isAiPreview={Boolean(aiPreviewMode)}
                        open={openPreviews[preview.id] ?? false}
                        preview={preview}
                        onToggle={() => setOpenPreviews((current) => ({ ...current, [preview.id]: !(current[preview.id] ?? false) }))}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div id="workflow-step-4" className="scroll-mt-24 sticky bottom-3 z-[200] rounded-lg border border-info-border/80 bg-info-surface/88 p-4 shadow-soft ring-1 ring-info-border/70 backdrop-blur-xl">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    checked={confirmed}
                    disabled={busy || previewStale || submissionLocked}
                    className="mt-1 h-4 w-4 accent-primary"
                    type="checkbox"
                    onChange={(event) => setConfirmed(event.target.checked)}
                  />
                  <span>
                    <span className="block font-semibold text-foreground">Xác nhận sau khi xem lại bản xem trước</span>
                    <span className="mt-1 block text-info">
                      Tôi xác nhận gửi đúng các câu trả lời xem trước này và hiểu hệ thống không hỗ trợ spam, proxy, vượt captcha hoặc gửi khi không được phép.
                    </span>
                  </span>
                </label>
                <div className="mt-4 flex flex-col gap-3 border-t border-info-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-medium text-info">
                    {submissionLocked
                      ? "Lượt gửi này đã hoàn tất. Hãy thực hiện lại bước 2 để tạo bản xem trước mới nếu muốn gửi tiếp."
                      : "Hệ thống chỉ gửi sau khi ô xác nhận được bật."}
                  </p>
                  <Button className="w-full bg-primary text-inverse-foreground hover:bg-primary sm:w-auto" disabled={busy || !confirmed || submissionLocked || previewStale} onClick={submitConfirmed} type="button">
                    {isSending ? "Đang gửi, chờ kết quả..." : submissionLocked ? "Lượt gửi đã kết thúc" : `Xác nhận gửi ${previews.length} lượt`}
                  </Button>
                </div>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {submission && (
        <Card id="workflow-step-5" className="scroll-mt-24 rounded-2xl bg-surface shadow-none">
          <CardHeader>
            <CardTitle>5. Kết quả gửi</CardTitle>
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
              <div className="rounded-lg border border-info-border/80 bg-info-surface/85 p-4 text-info shadow-sm backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">Thực hiện lại một lần nữa</p>
                    <p className="mt-1 text-xs text-info">
                      Làm mới bản xem trước, kết quả gửi và trạng thái xác nhận; giữ nguyên cách trả lời đã cài đặt ở bước 2.
                    </p>
                  </div>
                  <Button className="w-full sm:w-auto" disabled={busy} onClick={restartFromAnswerRules} type="button">
                    Thực hiện lại
                  </Button>
                </div>
              </div>
            )}
            <div className="overflow-hidden rounded-lg border border-border/70 bg-surface/72 shadow-sm backdrop-blur">
              <button
                aria-expanded={submissionLogsOpen}
                className="flex w-full flex-col gap-3 px-4 py-3 text-left transition hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                type="button"
                onClick={() => setSubmissionLogsOpen((current) => !current)}
              >
                <span>
                  <span className="block text-sm font-semibold">Chi tiết các lượt gửi</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {buildSubmissionBatches(submission.logs).length} nhóm, thành công {submission.successCount}, lỗi {submission.failedCount}
                  </span>
                </span>
                <span className="inline-flex items-center gap-2 self-start rounded-md border border-border/70 bg-surface/80 px-2.5 py-1.5 text-xs font-semibold text-primary sm:self-auto">
                  {submissionLogsOpen ? "Thu gọn" : "Mở chi tiết"}
                  {submissionLogsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>
              {submissionLogsOpen && (
                <div className="space-y-3 border-t border-border/70 p-3">
                  {buildSubmissionBatches(submission.logs).map((batch, batchIndex) => {
                    const successCount = batch.filter((log) => log.status === "Success").length;
                    const failedCount = batch.length - successCount;
                    return (
                      <div className="rounded-lg border border-border/70 bg-surface/55 p-3" key={`submission-pack-${batchIndex}`}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-semibold">Nhóm {batchIndex + 1}</p>
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
      </fieldset>
      <WorkflowSummary title={analysis?.formTitle} questionCount={analysis?.questions.length ?? 0} mode={generationMode} requestedCount={previewCount} previewCount={previews.length} multiplier={aiCreditMultiplier} balance={creditBalance} creditsUsed={generationResult?.creditsUsed} stale={previewStale} />
      </div>
    </div>
  );
}
