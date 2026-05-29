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
    <div className="grid gap-2 md:grid-cols-3">
      {generationModeOptions.map((option) => {
        const active = value === option.value;
        const isCustomAi = option.value === "ai-custom";
        const Icon = option.value === "rules" ? SlidersHorizontal : option.value === "ai-default" ? Bot : Sparkles;
        return (
          <button
            className={`group flex min-h-[92px] flex-col items-start justify-between rounded-lg border p-3 text-left shadow-sm transition ${
              active
                ? isCustomAi
                  ? "border-violet-300 bg-violet-50/85 text-violet-950 ring-1 ring-violet-100"
                  : "border-cyan-300 bg-cyan-50/85 text-cyan-950 ring-1 ring-cyan-100"
                : "border-border/70 bg-white/70 text-slate-700 hover:border-cyan-200 hover:bg-cyan-50/45"
            }`}
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="h-4 w-4" />
                {option.title}
              </span>
              <Badge tone={option.value === "rules" ? "neutral" : option.value === "ai-default" ? "info" : "warning"}>{option.badge}</Badge>
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
