import { Badge } from "@/components/ui";
import { displayStatus } from "@/lib/labels";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Success" || status === "Approved" || status === "Completed" || status === "Submitted" || status === "Paid" || status === "Ready"
      ? "success"
      : status === "Failed" || status === "Rejected" || status === "MissingConfiguration"
        ? "danger"
        : status === "Pending" || status === "Previewed" || status === "Created" || status === "NotChecked"
          ? "warning"
          : "neutral";

  return <Badge tone={tone}>{displayStatus(status)}</Badge>;
}
