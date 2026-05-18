import { Badge } from "@/components/ui";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Success" || status === "Approved" || status === "Completed" || status === "Submitted"
      ? "success"
      : status === "Failed" || status === "Rejected"
        ? "danger"
        : status === "Pending" || status === "Previewed"
          ? "warning"
          : "neutral";

  return <Badge tone={tone}>{status}</Badge>;
}
