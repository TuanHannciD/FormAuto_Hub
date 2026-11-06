import { ApiError, type SubmissionJob } from "@/lib/api";

export type HistoryCommand = { contractVersion: 2; userId: string; projectId: string; commandId: string; batchId: string | null };
const legacyKey = (userId: string) => `formauto.historyCommand.${userId}`;
const prefix = (userId: string) => `${legacyKey(userId)}.command.`;
const key = (value: HistoryCommand) => `${prefix(value.userId)}${encodeURIComponent(value.commandId)}`;
export const HISTORY_COMMAND_CHANGED_EVENT = "formauto-history-command-changed";

function read(key: string, userId: string): HistoryCommand | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    return value?.userId === userId && value.contractVersion === 2 && typeof value.projectId === "string" && typeof value.commandId === "string" ? value : null;
  } catch { return null; }
}
export function readHistoryCommands(userId: string): HistoryCommand[] {
  const commands = new Map<string, HistoryCommand>();
  // Distinct command keys avoid a read/modify/write race between independent tabs.
  for (let i = 0; i < localStorage.length; i++) {
    const storedKey = localStorage.key(i);
    if (!storedKey?.startsWith(prefix(userId))) continue;
    const value = read(storedKey, userId);
    if (value && storedKey === key(value)) commands.set(value.commandId, value);
  }
  // Old singleton evidence stays untouched until this exact command is resolved.
  const legacy = read(legacyKey(userId), userId);
  if (legacy && !commands.has(legacy.commandId)) commands.set(legacy.commandId, legacy);
  return [...commands.values()].sort((a, b) => a.commandId.localeCompare(b.commandId));
}
export function readHistoryCommand(userId: string): HistoryCommand | null {
  return readHistoryCommands(userId)[0] ?? null;
}
function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(HISTORY_COMMAND_CHANGED_EVENT));
}
export function subscribeHistoryCommands(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(HISTORY_COMMAND_CHANGED_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(HISTORY_COMMAND_CHANGED_EVENT, listener);
  };
}
export function storeHistoryCommand(value: HistoryCommand) {
  localStorage.setItem(key(value), JSON.stringify(value));
  notify();
}
export function removeHistoryCommand(value: HistoryCommand) {
  if (read(key(value), value.userId)?.commandId === value.commandId) localStorage.removeItem(key(value));
  if (read(legacyKey(value.userId), value.userId)?.commandId === value.commandId) localStorage.removeItem(legacyKey(value.userId));
  notify();
}
export function unresolvedJob(job: SubmissionJob) {
  return (job.unknownCount ?? job.fees?.unknownCount ?? 0) > 0 || (job.heldCount ?? 0) > 0 || (job.fees?.heldCredits ?? 0) > 0
    || job.items?.some(item => ["PossibleDispatch", "Unknown"].includes(item.attemptState) || ["Held", "PrepaidHeld"].includes(item.settlementState));
}
export function terminalJob(job: SubmissionJob) {
  return ["Completed", "Failed", "Cancelled"].includes(job.status) && !unresolvedJob(job)
    && (job.contractVersion !== 2 || Boolean(job.runnerAcknowledgedAt || job.fees?.runnerAcknowledged));
}
export function historyError(error: unknown) {
  const code = error instanceof ApiError ? error.code : undefined;
  const messages: Record<string, string> = {
    ClientUpgradeRequired: "Phiên làm việc dùng hợp đồng cũ. Hãy tải lại trang và xem lại giá trước khi tiếp tục.",
    HistoryExpired: "Lượt tạo đã hết hạn tái sử dụng. Hãy chọn một lượt còn trong lịch sử.",
    FormIncompatible: "Cấu trúc biểu mẫu đã thay đổi. Cần tạo một lượt mới trước khi gửi.",
    FormEvidenceUnavailable: "Chưa đủ bằng chứng về biểu mẫu để gửi an toàn. Nội dung đã tạo vẫn có thể xem, hiện chưa thể gửi.",
    InsufficientAvailableCredit: "Credit khả dụng chưa đủ cho toàn bộ lựa chọn. Hãy chọn ít câu trả lời hơn hoặc nạp thêm.",
    CommandConflict: "Mã lệnh xung đột với yêu cầu đã ghi nhận. Chỉ kiểm tra kết quả lệnh cũ, không tự gửi lại.",
    OutcomeUnresolved: "Có kết quả gửi chưa xác định. Credit liên quan tiếp tục được giữ để đối soát; không gửi lại.",
    ActiveSubmissionJob: "Biểu mẫu còn lượt gửi hoặc kết quả chưa giải quyết. Hãy kiểm tra kết quả trước khi gửi thêm."
  };
  return code && messages[code] ? messages[code] : error instanceof ApiError && error.status === 404
    ? "Không tìm thấy lượt tạo hoặc lượt đã hết hạn tái sử dụng."
    : "Không tải được dữ liệu. Hãy kiểm tra kết nối rồi tải lại.";
}
