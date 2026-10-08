import { cn } from "@/lib/utils";

// Shared visual defaults. Components and links can override layout with className.
export const panelStyles = "rounded-2xl border border-border bg-surface shadow-none";
export type ControlSize = "default" | "lg";
export type ButtonSize = "default" | "lg" | "icon";
export type ButtonVariant = "primary" | "secondary" | "danger";

export function controlStyles({ controlSize = "default", className }: { controlSize?: ControlSize; className?: string } = {}) {
  return cn(
    "w-full rounded-xl border border-border-strong bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
    controlSize === "lg" ? "min-h-[54px] text-[15px]" : "min-h-10",
    className
  );
}

export function buttonStyles({ variant = "primary", size = "default", className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
    size === "lg" ? "min-h-14 px-4 py-3 font-bold" : size === "icon" ? "h-10 w-10 shrink-0 p-0" : "min-h-10 px-4 py-2",
    variant === "primary" && "bg-primary text-primary-foreground shadow-soft hover:bg-primary-hover",
    variant === "secondary" && "border border-border-strong bg-surface text-foreground shadow-sm hover:bg-surface-subtle",
    variant === "danger" && "bg-destructive text-destructive-foreground hover:opacity-90",
    className
  );
}
