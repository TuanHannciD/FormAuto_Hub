import { Loader2 } from "lucide-react";

export function LoadingState({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-2 text-sm text-muted-foreground ${compact ? "py-3" : "min-h-[60vh]"}`}>
      <Loader2 className="animate-spin" size={18} />
      {label}
    </div>
  );
}
