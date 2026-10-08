import { cn } from "@/lib/utils";
import { buttonStyles, controlStyles, panelStyles, type ButtonSize, type ButtonVariant, type ControlSize } from "./ui-styles";

export { Dialog, DialogContent, DialogTitle, DialogClose } from "./dialog";

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-border/70 px-5 py-4", className)} {...props} />;
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
  return <section className={cn(panelStyles, className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-border px-5 py-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-[17px] font-bold leading-6", className)} {...props} />;
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
        <h1 className={cn("break-words text-[27px] font-bold leading-tight tracking-tight text-foreground sm:text-[32px]", eyebrow && "mt-2")}>{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary-foreground">{description}</p>}
      </div>
      {actions && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">{actions}</div>}
    </div>
  );
}

export function MobileRecordList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-3 md:hidden", className)} {...props} />;
}

export function MobileRecord({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <article className={cn(panelStyles, "p-4", className)} {...props} />;
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
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}

export function Input({ className, controlSize, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { controlSize?: ControlSize }) {
  return (
    <input
      className={controlStyles({ controlSize, className })}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={controlStyles({ className: cn("min-h-24", className) })}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={controlStyles({ className })}
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
        tone === "neutral" && "bg-surface-subtle/80 text-muted-foreground",
        tone === "success" && "bg-success-surface text-success",
        tone === "warning" && "bg-warning-surface text-warning",
        tone === "danger" && "bg-destructive-surface text-destructive",
        tone === "info" && "bg-info-surface text-info",
        className
      )}
      {...props}
    />
  );
}

export function Alert({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-info-border bg-info-surface p-4 text-sm leading-6 text-info", className)} {...props} />;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface-subtle p-6 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
