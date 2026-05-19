import { Badge } from "@/components/ui";
import { displayStatus } from "@/lib/labels";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Success" || status === "Approved" || status === "Completed" || status === "Submitted"
      ? "success"
      : status === "Failed" || status === "Rejected"
        ? "danger"
        : status === "Pending" || status === "Previewed"
          ? "warning"
          : "neutral";

  return <Badge tone={tone}>{displayStatus(status)}</Badge>;
}
