import { CheckCircle2, ChevronDown, ChevronUp, FileQuestion, SlidersHorizontal } from "lucide-react";
import { Badge, Button, Input, Textarea } from "@/components/ui";
import { DropdownSelect } from "@/components/dropdown-select";
import {
  MAX_RULE_VALUES,
  MAX_SAMPLE_LENGTH,
  MAX_SAMPLE_LINES,
  PERCENTAGE_TOTAL,
  TIME_STEP_MAX,
  TIME_STEP_MIN,
  modeOptions
} from "../_constants";
import type { FormQuestion } from "@/lib/api";
import { CheckboxSelectionFields } from "./CheckboxSelectionFields";
import {
  buildChoiceConfig,
  buildChoiceNumberConfig,
  clampCheckboxSelection,
  clampInteger,
  defaultConfigForMode,
  isFreeTextRuleQuestion,
  limitText,
  mergeCheckboxSelection,
  readCheckboxSelection,
  readChoiceNumbers,
  readChoiceValues,
  readDateRange,
  readSamples,
  readTimeRange,
  questionTypeLabel
} from "../_helpers";
export function RuleEditor({
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
    <div className={`rounded-lg border bg-white/72 p-4 shadow-sm backdrop-blur transition ${expanded ? "border-border/70" : "border-cyan-100"}`}>
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
                ? "border-border/70 bg-white/80 text-muted-foreground hover:bg-muted/50"
                : "border-cyan-200 bg-cyan-50/85 text-cyan-800 hover:bg-cyan-100"
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
        <div className="mb-4 rounded-md border border-border/70 bg-white/55 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Lựa chọn lấy từ form gốc</p>
          <div className="flex flex-wrap gap-2">
            {question.options.map((option) => {
              const active = selectedOptions.includes(option);
              return (
                <button
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                    active ? "border-cyan-300 bg-cyan-50 text-cyan-800" : "border-border/70 bg-white/75 text-muted-foreground"
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
          <div className="rounded-md border border-border/70 bg-white/55 p-3">
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
          <div className="rounded-md border border-border/70 bg-white/55 p-3">
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
          <div className="rounded-md border border-border/70 bg-white/55 p-3">
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
                <label className="grid grid-cols-1 gap-2 rounded-md border border-border/70 bg-white/75 px-3 py-2 text-sm sm:grid-cols-[1fr_120px] sm:items-center sm:gap-3" key={option}>
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
          <div className="rounded-md border border-border/70 bg-white/55 p-3 text-sm">
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