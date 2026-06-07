import { Badge } from "@/components/ui";
import { displayStatus } from "@/lib/labels";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Success" || status === "Approved" || status === "Completed" || status === "Submitted" || status === "Paid" || status === "Ready" || status === "Active" || status === "Imported"
      ? "success"
      : status === "Failed" || status === "Rejected" || status === "MissingConfiguration" || status === "InvalidConfiguration"
        ? "danger"
        : status === "Pending" || status === "Previewed" || status === "Created" || status === "NotChecked" || status === "Draft" || status === "Partial"
          ? "warning"
          : "neutral";

  return <Badge tone={tone}>{displayStatus(status)}</Badge>;
}
