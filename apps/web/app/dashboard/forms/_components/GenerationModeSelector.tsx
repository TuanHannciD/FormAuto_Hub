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
                ? isRules
                  ? "border-cyan-300 bg-cyan-50/85 text-cyan-950 shadow-sm ring-1 ring-cyan-100"
                  : isAiDefault
                    ? "border-cyan-500 bg-cyan-50 text-cyan-950 shadow-md shadow-cyan-200/30 ring-2 ring-cyan-300"
                    : "border-violet-500 bg-violet-50 text-violet-950 shadow-md shadow-violet-200/30 ring-2 ring-violet-300"
                : "border-border/70 bg-white/70 text-slate-700 shadow-sm hover:border-cyan-300 hover:bg-cyan-50/60 hover:shadow-md"
            }`}
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {active && !isRules && (
              <div
                className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full ${
                  isAiDefault ? "bg-cyan-400" : "bg-violet-400"
                }`}
              />
            )}
            <span className="flex w-full items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon className={`h-4 w-4 ${
                  active && !isRules
                    ? isAiDefault
                      ? "text-cyan-600"
                      : "text-violet-600"
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
            <span className="mt-3 text-xs font-medium text-muted-foreground group-hover:text-slate-700">
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
