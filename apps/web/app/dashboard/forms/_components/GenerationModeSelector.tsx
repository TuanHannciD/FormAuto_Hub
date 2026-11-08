import { cn } from "@/lib/utils";
import { panelStyles } from "@/components/ui-styles";
import { Bot, SlidersHorizontal, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui";
import type { GenerationMode } from "../_types";
import { generationModeOptions } from "../_constants";

export function GenerationModeSelector({
  value,
  onChange
}: {
  value: GenerationMode;
  onChange: (value: GenerationMode) => void;
}) {
  return (
    <div className="relative grid gap-3 md:grid-cols-3" aria-label="Chọn cách tạo câu trả lời">
      {generationModeOptions.map((option) => {
        const active = value === option.value;
        const isCustomAi = option.value === "ai-custom";
        const isAiDefault = option.value === "ai-default";
        const isRules = option.value === "rules";
        const Icon = option.value === "rules" ? SlidersHorizontal : option.value === "ai-default" ? Bot : Sparkles;
        return (
          <button
            className={cn(panelStyles, `relative flex min-h-[108px] flex-col items-start justify-between p-4 text-left transition ${
              active
                ? "border-primary bg-primary-soft text-primary ring-1 ring-primary"
                : "border-border bg-surface text-secondary-foreground hover:border-primary-border hover:bg-primary-soft "
            }`)}
            key={option.value}
            aria-pressed={active}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {active && !isRules && (
              <div
                className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full ${
                  isAiDefault ? "bg-accent" : "bg-primary"
                }`}
              />
            )}
              <span className="flex w-full flex-wrap items-start justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon className={`h-4 w-4 ${
                  active && !isRules
                    ? isAiDefault
                      ? "text-accent"
                      : "text-primary"
                    : ""
                }`} />
                {option.title}
              </span>
              <Badge className="shrink-0" tone={
                option.value === "rules"
                  ? "neutral"
                  : active && isAiDefault
                    ? "info"
                    : active && isCustomAi
                      ? "warning"
                      : option.value === "ai-default"
                        ? "info"
                        : "warning"
              }>{option.badge}</Badge>
            </span>
            <span className="mt-2 max-w-[22rem] text-xs leading-5 text-muted-foreground group-hover:text-secondary-foreground">
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
