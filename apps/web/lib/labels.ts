export function displayStatus(status: string) {
  const labels: Record<string, string> = {
    Success: "Thành công",
    Approved: "Đã duyệt",
    Completed: "Hoàn tất",
    Submitted: "Đã gửi",
    Failed: "Thất bại",
    Rejected: "Bị từ chối",
    Pending: "Đang chờ",
    Previewed: "Đã tạo bản xem trước",
    Running: "Đang chạy",
    Paused: "Đã tạm dừng",
    Cancelled: "Đã hủy",
    Canceled: "Đã hủy",
    Created: "Đã tạo",
    Paid: "Đã thanh toán",
    Ready: "Sẵn sàng",
    MissingConfiguration: "Thiếu cấu hình",
    NotChecked: "Chưa kiểm tra",
    PAID: "Đã thanh toán",
    PENDING: "Đang chờ",
    CANCELLED: "Đã hủy",
    CANCELLED_BY_USER: "Người dùng đã hủy"
  };

  return labels[status] ?? status;
}

export function displayAction(action: string) {
  const labels: Record<string, string> = {
    AnalyzeForm: "Phân tích biểu mẫu",
    GeneratePreview: "Tạo bản xem trước",
    GenerateResponses: "Tạo bản xem trước",
    "Xem lại câu trả lời được tạo": "Xem câu trả lời được tạo",
    SubmitResponses: "Gửi câu trả lời",
    Submission: "Gửi câu trả lời",
    TopupApproved: "Duyệt yêu cầu nạp",
    InitialGrant: "Tặng credit ban đầu"
  };

  return labels[action] ?? action;
}

export function displayCreditTransactionType(type: string) {
  const labels: Record<string, string> = {
    Topup: "Nạp credit",
    TopupApproved: "Nạp credit đã duyệt",
    Usage: "Sử dụng credit",
    InitialGrant: "Credit khởi đầu",
    Refund: "Hoàn credit"
  };

  return labels[type] ?? type;
}

export function displayToolName(toolName: string) {
  const labels: Record<string, string> = {
    FormAutomation: "Tự động hóa biểu mẫu",
    GoogleForms: "Google Forms",
    Topup: "Nạp credit"
  };

  return labels[toolName] ?? toolName;
}
