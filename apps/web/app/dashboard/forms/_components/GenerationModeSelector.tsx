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
    <div className="relative grid gap-2 md:grid-cols-3">
      {generationModeOptions.map((option) => {
        const active = value === option.value;
        const isCustomAi = option.value === "ai-custom";
        const isAiDefault = option.value === "ai-default";
        const isRules = option.value === "rules";
        const Icon = option.value === "rules" ? SlidersHorizontal : option.value === "ai-default" ? Bot : Sparkles;
        return (
          <button
            className={`relative flex min-h-[92px] flex-col items-start justify-between rounded-lg border p-3 text-left transition ${
              active
                ? "border-primary bg-primary-soft text-primary shadow-raised ring-2 ring-primary-border"
                : "border-border/70 bg-surface/70 text-secondary-foreground shadow-sm hover:border-primary-border hover:bg-primary-soft/60 hover:shadow-md"
            }`}
            key={option.value}
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
            <span className="flex w-full items-center justify-between gap-2">
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
              <Badge tone={
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
            <span className="mt-3 text-xs font-medium text-muted-foreground group-hover:text-secondary-foreground">
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
