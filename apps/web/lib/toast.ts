import { toast } from "sonner";

export function readableError(error: unknown, fallback = "Yêu cầu không thành công.") {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (!raw) {
    return fallback;
  }

  const firstLine = raw.split(/\r?\n/)[0]?.trim();
  if (!firstLine) {
    return fallback;
  }

  if (firstLine.includes("System.") || firstLine.includes(" at ") || firstLine.length > 180) {
    return fallback;
  }

  return firstLine;
}

export function showError(error: unknown, fallback = "Yêu cầu không thành công.") {
  const message = readableError(error, fallback);
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (raw && raw !== message) {
    console.error(fallback, error);
  }

  toast.error(message);
}
