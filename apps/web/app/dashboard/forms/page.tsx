"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, FileQuestion, FileText, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { DropdownSelect } from "@/components/dropdown-select";
import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, Textarea } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import {
  apiFetch,
  type AnalyzeFormResponse,
  type FormQuestion,
  type GeneratedResponse,
  type GenerateResponsesResult,
  type SubmissionJob
} from "@/lib/api";
import { formatDate } from "@/lib/utils";

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

export default function FormsPage() {
  const [formUrl, setFormUrl] = useState("");
  const [name, setName] = useState("");
  const [analysis, setAnalysis] = useState<AnalyzeFormResponse | null>(null);
  const [ruleConfigs, setRuleConfigs] = useState<Record<string, { mode: string; configJson: string }>>({});
  const [previewCount, setPreviewCount] = useState(1);
  const [previews, setPreviews] = useState<GeneratedResponse[]>([]);
  const [openPreviews, setOpenPreviews] = useState<Record<string, boolean>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [submission, setSubmission] = useState<SubmissionJob | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const canGenerate = useMemo(() => {
    if (!analysis || analysis.questions.length === 0) {
      return false;
    }

    return analysis.questions.every((question) => {
      const config = ruleConfigs[question.id];
      return config?.mode && config.configJson.trim();
    });
  }, [analysis, ruleConfigs]);

  async function analyze(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setPreviews([]);
    setOpenPreviews({});
    setSubmission(null);
    setConfirmed(false);
    try {
      const result = await apiFetch<AnalyzeFormResponse>("/api/forms/analyze", {
        method: "POST",
        json: { formUrl, name }
      });
      setAnalysis(result);
      setRuleConfigs(Object.fromEntries(result.questions.map((question) => [question.id, defaultRule(question)])));
      setMessage("Đã phân tích biểu mẫu. Hãy kiểm tra câu hỏi và cài đặt cách trả lời trước khi tạo bản xem trước.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không phân tích được biểu mẫu.");
    } finally {
      setBusy(false);
    }
  }

  async function saveRulesAndGenerate() {
    if (!analysis) {
      return;
    }

    setBusy(true);
    setMessage("");
    setPreviews([]);
    setOpenPreviews({});
    setSubmission(null);
    setConfirmed(false);
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
      setOpenPreviews(Object.fromEntries(result.items.map((preview, index) => [preview.id, index === 0])));
      setMessage(`Đã tạo ${result.items.length} câu trả lời xem trước và trừ ${result.creditsUsed} credit.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tạo được bản xem trước.");
    } finally {
      setBusy(false);
    }
  }

  async function submitConfirmed() {
    if (!analysis || previews.length === 0 || !confirmed) {
      setMessage("Bạn phải xem lại bản xem trước và chọn ô xác nhận trước khi gửi.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const result = await apiFetch<SubmissionJob>(`/api/projects/${analysis.projectId}/submissions/send`, {
        method: "POST",
        json: {
          responseIds: previews.map((preview) => preview.id),
          confirmed: true
        }
      });
      setSubmission(result);
      setMessage("Đã bắt đầu gửi các câu trả lời đã xác nhận.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không gửi được bản xem trước.");
    } finally {
      setBusy(false);
    }
  }

  async function pauseSubmission() {
    if (!analysis || !submission) {
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const result = await apiFetch<SubmissionJob>(`/api/projects/${analysis.projectId}/submissions/jobs/${submission.id}/pause`, {
        method: "POST"
      });
      setSubmission(result);
      setMessage("Đã tạm dừng sau nhóm gửi hiện tại.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tạm dừng được lượt gửi.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelSubmission() {
    if (!analysis || !submission) {
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const result = await apiFetch<SubmissionJob>(`/api/projects/${analysis.projectId}/submissions/jobs/${submission.id}/cancel`, {
        method: "POST"
      });
      setSubmission(result);
      setMessage("Đã hủy lượt gửi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không hủy được lượt gửi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Tự động hóa Google Form</h2>
          <p className="mt-1 text-sm text-muted-foreground">Phân tích biểu mẫu, cài đặt câu trả lời, xem trước và chỉ gửi sau khi xác nhận.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="info">Tối đa 100 bản xem trước</Badge>
          <Badge tone="neutral">Mỗi lượt gửi {SUBMISSION_BATCH_SIZE}</Badge>
          <Badge tone="success">Cần xác nhận trước khi gửi</Badge>
        </div>
      </div>

      <Alert className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Không tự gửi hàng loạt. Mỗi lần chỉ tạo tối đa 100 câu trả lời xem trước, gửi tuần tự theo nhóm {SUBMISSION_BATCH_SIZE} và phải xác nhận trước khi gửi.</span>
      </Alert>

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
            <Button disabled={busy || !formUrl.trim()} type="submit">Phân tích biểu mẫu</Button>
          </form>
          {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>2. Câu hỏi và cách trả lời</CardTitle>
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
                    question={question}
                    value={ruleConfigs[question.id] ?? defaultRule(question)}
                    onChange={(value) => setRuleConfigs((current) => ({ ...current, [question.id]: value }))}
                  />
                ))}
                <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border pt-4">
                  <div>
                    <p className="text-sm font-medium">Số câu trả lời xem trước</p>
                    <p className="mt-1 text-xs text-muted-foreground">Tối thiểu 1, tối đa {PREVIEW_COUNT_MAX} cho mỗi lần tạo.</p>
                    <Input
                      className="mt-2 w-32"
                      inputMode="numeric"
                      max={PREVIEW_COUNT_MAX}
                      min={PREVIEW_COUNT_MIN}
                      step={1}
                      type="number"
                      value={previewCount}
                      onChange={(event) => setPreviewCount(clampInteger(event.target.value, PREVIEW_COUNT_MIN, PREVIEW_COUNT_MAX))}
                    />
                  </div>
                  <Button disabled={busy || !canGenerate} onClick={saveRulesAndGenerate} type="button">
                    Lưu cách trả lời và tạo bản xem trước
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>3. Xem trước và xác nhận</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {previews.length === 0 ? (
            <EmptyState title="Chưa có bản xem trước" detail="Hãy tạo bản xem trước trước khi gửi. Hệ thống sẽ chặn nếu chưa có bản xem trước hoặc chưa xác nhận." />
          ) : (
            <>
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

              <div className="space-y-2">
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

              <div className="rounded-lg border border-border bg-white p-4">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    checked={confirmed}
                    className="mt-1 h-4 w-4 accent-primary"
                    type="checkbox"
                    onChange={(event) => setConfirmed(event.target.checked)}
                  />
                  <span>
                    <span className="block font-medium">Xác nhận sau khi xem lại bản xem trước</span>
                    <span className="mt-1 block text-muted-foreground">
                      Tôi xác nhận gửi đúng các câu trả lời xem trước này và hiểu hệ thống không hỗ trợ spam, proxy, vượt captcha hoặc gửi khi không được phép.
                    </span>
                  </span>
                </label>
                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">Hệ thống chỉ gửi sau khi ô xác nhận được bật.</p>
                  <Button disabled={busy || !confirmed} onClick={submitConfirmed} type="button">
                    Gửi các bản xem trước đã xác nhận
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy} onClick={pauseSubmission} type="button">Tạm dừng</Button>
                <Button disabled={busy} onClick={cancelSubmission} type="button">Hủy</Button>
              </div>
            )}
            {submission.status === "Paused" && (
              <Button disabled={busy} onClick={cancelSubmission} type="button">Hủy lượt gửi đang tạm dừng</Button>
            )}
            {submission.logs.map((log) => (
              <div className="rounded-md border border-border p-3" key={log.id}>
                <StatusBadge status={log.status} /> <span className="ml-2">{log.errorMessage || "Đã gửi"}</span>
              </div>
            ))}
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
        <StatusBadge status={preview.status} />
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
  question,
  value,
  onChange
}: {
  index: number;
  question: FormQuestion;
  value: { mode: string; configJson: string };
  onChange: (value: { mode: string; configJson: string }) => void;
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
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
            <FileQuestion className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">Câu {index + 1}: {question.label}</p>
              <Badge>{questionTypeLabel(question.questionType)}</Badge>
              {question.required && <Badge tone="warning">Bắt buộc</Badge>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{question.entryId}</p>
          </div>
        </div>
        <Badge tone={isTextQuestion ? "neutral" : "info"}>{isTextQuestion ? "Nhập chữ" : `${question.options.length} lựa chọn`}</Badge>
      </div>

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
                <label className="grid grid-cols-[1fr_120px] items-center gap-3 rounded-md border border-border bg-white px-3 py-2 text-sm" key={option}>
                  <span className="min-w-0 truncate font-medium">{option}</span>
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
