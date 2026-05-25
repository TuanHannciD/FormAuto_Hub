import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onOpenChange,
  children,
  className
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className={cn("fixed inset-0 z-50 !mt-0 flex items-center justify-center px-4 py-6", className)}>
      <button
        aria-label="Đóng"
        className="absolute inset-0 bg-slate-950/45"
        onClick={() => onOpenChange?.(false)}
        type="button"
      />
      {children}
    </div>
  );
}

export function DialogContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-panel relative z-10 max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-lg",
        className
      )}
      {...props}
    />
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-border/70 px-5 py-4", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm text-muted-foreground", className)} {...props} />;
}

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-wrap justify-end gap-2 border-t border-border/70 px-5 py-4", className)} {...props} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("glass-panel rounded-lg", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-border/70 px-5 py-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-[15px] font-bold", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-medium text-primary">{eyebrow}</p>}
        <h2 className={cn("font-extrabold leading-tight text-slate-950", eyebrow ? "mt-2 text-[28px]" : "text-[28px]")}>{title}</h2>
        <div className="aura-divider mt-3 h-px w-28 rounded-full" />
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">{actions}</div>}
    </div>
  );
}

export function MobileRecordList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-3 md:hidden", className)} {...props} />;
}

export function MobileRecord({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <article className={cn("glass-panel rounded-lg p-4", className)} {...props} />;
}

export function KeyValueRow({
  label,
  value,
  className
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-t border-border py-2 first:border-t-0 first:pt-0 last:pb-0", className)}>
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-foreground shadow-[0_10px_24px_rgb(8_145_169_/_0.18)] hover:bg-primary/90",
        variant === "secondary" && "border border-border/80 bg-white/78 text-foreground shadow-sm backdrop-blur hover:bg-white",
        variant === "danger" && "bg-destructive text-destructive-foreground hover:opacity-90",
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("min-h-10 w-full rounded-md border border-border/80 bg-white/82 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10", className)}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("min-h-24 w-full rounded-md border border-border/80 bg-white/82 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10", className)}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("min-h-10 w-full rounded-md border border-border/80 bg-white/82 px-3 py-2 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10", className)}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "neutral" && "bg-slate-100/80 text-slate-500",
        tone === "success" && "bg-emerald-50 text-emerald-700",
        tone === "warning" && "bg-amber-50 text-amber-700",
        tone === "danger" && "bg-red-50 text-red-700",
        tone === "info" && "bg-cyan-50 text-primary",
        className
      )}
      {...props}
    />
  );
}

export function Alert({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-cyan-200/80 bg-cyan-50/80 p-4 text-sm text-cyan-950 shadow-sm backdrop-blur", className)} {...props} />;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/80 bg-white/55 p-6 text-center backdrop-blur">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
