import { toast } from "sonner";
import { SessionExpiredError } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { NckhGoogleAuthorizationError } from "@/lib/nckh-google-auth";

export function readableError(error: unknown, fallback = "Yêu cầu không thành công.") {
  if (error instanceof ApiError || error instanceof SessionExpiredError) return error.message;
  if (error instanceof NckhGoogleAuthorizationError) {
    return "Hãy liên kết lại tài khoản Google trong NCKH để tiếp tục.";
  }
  return fallback;
}

export function showError(error: unknown, fallback = "Yêu cầu không thành công.") {
  // The login route owns the single session-expired notification.
  if (error instanceof SessionExpiredError || (error instanceof Error && error.name === "AbortError")) {
    return;
  }
  const message = readableError(error, fallback);
  toast.error(message);
}
