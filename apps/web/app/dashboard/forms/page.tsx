"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
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
// === FILE MAP (page.tsx – 1089 dòng) ===
// Dòng    Function                        Mục đích
// 59      FormsPage()                     Trang chính: phân tích form, cấu hình rule, preview, submit
// 78-154  State declarations              useState/useRef/useMemo: formUrl, analysis, ruleConfigs, previews, submission, AI mode
// 155     useEffect                       Khôi phục resume context + lắng nghe BroadcastChannel/storage/focus
// 177     clearPreviewWorkflow()          Reset toàn bộ trạng thái preview
// 191     resetAiPreparation()            Reset trạng thái AI preparation
// 201     selectGenerationMode()          Chọn chế độ sinh: rules / AI default / custom
// 213     analyze()                       Phân tích Google Form từ URL
// 234     saveRulesAndGenerate()          Lưu rule config + tạo preview (rules mode)
// 297     continueMissingGeneration()     Tiếp tục generate khi thiếu credit (hiển thị gợi ý nạp)
// 360     createRecommendedTopupLink()    Tạo link nạp credit PayOS
// 405     restoreResumeContext()          Khôi phục context từ localStorage
// 426     refreshResumeCreditState()      Làm mới trạng thái credit sau resume
// 435     submitConfirmed()               Gửi batch submission đã xác nhận
// 461     pauseSubmission()               Tạm dừng submission
// 480     cancelSubmission()              Hủy submission
// 499     restartFromAnswerRules()        Quay lại bước cấu hình rule
// 511     loadAiPromptProfile()           Tải AI prompt profile đã lưu từ backend
// 533     autoFillAiPrompt()              Tự động điền AI prompt dựa trên direction
// 564     saveAiPromptProfile()           Lưu AI prompt profile lên backend
// 595     generateAiResponses()           Gọi API generate AI responses (backend)
// 605     loadGeneratedPreviews()         Tải preview đã generate từ backend
// 617     createAiPreviews()              Tạo AI preview từ prompt đã lưu
// 675     return (...)                    JSX render: form analysis, rules section, preview list, submission panel

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

  function clearPreviewWorkflow() {
    setPreviews([]);
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
      void loadAiPromptProfile(mode);
    }
  }

  async function analyze(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    clearPreviewWorkflow();
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
      setPreviews((current) => [...current, ...resultItems]);
      setAiPreviewMode(isAiContext ? contextMode : null);
      setPreviewListOpen(false);
      setOpenPreviews((current) => ({
        ...current,
        ...Object.fromEntries(resultItems.map((preview, index) => [preview.id, current[preview.id] ?? index === 0]))
      }));
      if (result.missingCredits > 0) {
        const nextContext = {
          ...context,
          requestedCount: continueCount,
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
      toast.success(`Đã tạo tiếp ${resultItems.length} bản xem trước và trừ ${result.creditsUsed} credit.`);
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
      generationMode,
      aiDirection,
      aiGlobalPrompt,
      aiPromptScope,
      aiQuestionPrompts,
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
    const contextMode = context.generationMode ?? "rules";
    const multiplier = contextMode === "ai-custom" ? 3 : contextMode === "ai-default" ? 2 : 1;
    setGenerationMode(contextMode);
    setPreviewCount(contextMode === "rules" ? context.missingCredits : Math.max(1, Math.ceil(context.missingCredits / multiplier)));
    setOpenRuleEditors(Object.fromEntries(context.analysis.questions.map((question) => [question.id, true])));
    setAiDirection(context.aiDirection ?? defaultAiDirection);
    setAiGlobalPrompt(context.aiGlobalPrompt ?? DEFAULT_AI_GLOBAL_PROMPT);
    setAiPromptScope(context.aiPromptScope ?? "global");
    setAiQuestionBlocksOpen(Object.fromEntries(context.analysis.questions.map((question) => [question.id, false])));
    setAiQuestionPrompts(context.aiQuestionPrompts ?? Object.fromEntries(context.analysis.questions.map((question) => [question.id, ""])));
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

  async function loadGeneratedPreviews(projectId: string, ids: string[]) {
    if (ids.length === 0) {
      return [];
    }

    const searchParams = new URLSearchParams();
    ids.forEach((id) => searchParams.append("ids", id));
    const response = await apiFetch<GeneratedResponseListResponse>(`/api/projects/${projectId}/responses?${searchParams.toString()}`);
    const byId = new Map(response.items.map((preview) => [preview.id, preview]));
    return ids.map((id) => byId.get(id)).filter((preview): preview is GeneratedResponse => Boolean(preview));
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
              step.active ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border/70 bg-white/65 text-muted-foreground backdrop-blur"
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
                {generationMode === "rules"
                  ? `Đang mở ${ruleOpenCount}/${analysis.questions.length} câu hỏi. Có thể mở từng câu để chỉnh nhanh.`
                  : "AI dùng prompt đã lưu, tạo preview read-only và chỉ trừ credit cho preview hợp lệ."}
              </p>
            </div>
            {generationMode === "rules" && (
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
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/70 bg-white/55 p-4 backdrop-blur">
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
                <div className="sticky bottom-3 z-10 flex flex-col gap-4 rounded-lg border border-cyan-200/80 bg-cyan-50/88 p-4 shadow-soft ring-1 ring-cyan-100/70 backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between">
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
                <div className="rounded-lg border border-cyan-200/80 bg-cyan-50/85 p-4 text-sm text-cyan-950 shadow-sm ring-1 ring-cyan-100/70 backdrop-blur">
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
              <div className="rounded-lg border border-border/70 bg-white/55 p-4 backdrop-blur">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium">Câu trả lời xem trước đã tạo</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Mở từng bản xem trước để kiểm tra câu trả lời trước khi xác nhận gửi.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiPreviewMode && <Badge tone="info">AI {aiPreviewMode === "ai-custom" ? "Option 3" : "Option 2"}</Badge>}
                    {aiPreviewMode && <Badge tone="warning">Chỉ đọc</Badge>}
                    <Badge tone="info">{previews.length} bản xem trước</Badge>
                    <Badge tone="neutral">{previews.reduce((sum, preview) => sum + preview.answers.length, 0)} câu trả lời</Badge>
                  </div>
                </div>
                {aiPreviewMode && (
                  <div className="mt-3 rounded-md border border-cyan-200 bg-cyan-50/80 px-3 py-2 text-xs font-medium text-cyan-900">
                    Bản xem trước AI đã được lưu read-only. Người dùng chỉ xác nhận gửi sau khi đã mở xem lại nội dung.
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-lg border border-border/70 bg-white/72 shadow-sm backdrop-blur">
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
                  <span className="inline-flex items-center gap-2 self-start rounded-md border border-border/70 bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-primary sm:self-auto">
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

              <div className="sticky bottom-3 z-10 rounded-lg border border-cyan-200/80 bg-cyan-50/88 p-4 shadow-soft ring-1 ring-cyan-100/70 backdrop-blur-xl">
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
              <div className="rounded-lg border border-cyan-200/80 bg-cyan-50/85 p-4 text-cyan-950 shadow-sm backdrop-blur">
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
            <div className="overflow-hidden rounded-lg border border-border/70 bg-white/72 shadow-sm backdrop-blur">
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
                <span className="inline-flex items-center gap-2 self-start rounded-md border border-border/70 bg-white/80 px-2.5 py-1.5 text-xs font-semibold text-primary sm:self-auto">
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
                      <div className="rounded-lg border border-border/70 bg-white/55 p-3" key={`submission-pack-${batchIndex}`}>
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