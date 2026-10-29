import type { ReactNode } from "react";
import { Card, CardContent } from "./ui";
import { cn } from "@/lib/utils";

const tones = {
  neutral: { border: "border-border", text: "text-foreground", icon: "bg-surface-subtle text-secondary-foreground" },
  primary: { border: "border-primary-border", text: "text-primary", icon: "bg-primary-soft text-primary" },
  info: { border: "border-info-border", text: "text-info", icon: "bg-info-surface text-info" },
  success: { border: "border-success-border", text: "text-success", icon: "bg-success-surface text-success" },
  warning: { border: "border-warning-border", text: "text-warning", icon: "bg-warning-surface text-warning" },
  danger: { border: "border-destructive-border", text: "text-destructive", icon: "bg-destructive-surface text-destructive" }
} as const;

export function MetricCard({ title, value, tone = "neutral", className, icon }: {
  title: string;
  value: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className={cn(tones[tone].border, className)}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-secondary-foreground">{title}</p>
          {icon && <span aria-hidden="true" className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", tones[tone].icon)}>{icon}</span>}
        </div>
        <p className={cn("mt-1.5 break-words text-2xl font-bold leading-tight tracking-tight tabular-nums", tones[tone].text)}>{value}</p>
      </CardContent>
    </Card>
  );
}
