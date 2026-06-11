import type { WorkspaceTab } from "./_types";

export const tabs: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "overview", label: "Tổng quan" },
  { id: "canvas", label: "Sơ đồ quan hệ" },
  { id: "generate", label: "Tạo form" },
  { id: "data", label: "Dữ liệu" },
  { id: "export", label: "Xuất dữ liệu" }
];

export const variableTypes = ["Independent", "Dependent", "Mediator", "Moderator", "Control"];
export const scaleTypes = ["Likert", "Ordinal", "Nominal", "Scale"];
export const relationDirections = ["Positive", "Negative"];

export const variableTypeLabels: Record<string, string> = {
  Independent: "Biến độc lập",
  Dependent: "Biến phụ thuộc",
  Mediator: "Biến trung gian",
  Moderator: "Biến điều tiết",
  Control: "Biến kiểm soát"
};

export const scaleTypeLabels: Record<string, string> = {
  Likert: "Thang Likert",
  Ordinal: "Thứ bậc",
  Nominal: "Định danh",
  Scale: "Thang tuyến tính"
};

export const relationDirectionLabels: Record<string, string> = {
  Positive: "Cùng chiều",
  Negative: "Ngược chiều"
};

export const questionTypeLabels: Record<string, string> = {
  Likert: "Thang Likert",
  Paragraph: "Đoạn văn",
  Text: "Văn bản",
  ShortAnswer: "Trả lời ngắn",
  MultipleChoice: "Trắc nghiệm một lựa chọn",
  Checkboxes: "Hộp kiểm nhiều lựa chọn",
  Dropdown: "Danh sách chọn",
  LinearScale: "Thang tuyến tính",
  Date: "Ngày",
  Time: "Thời gian"
};

export const nckhStatusLabels: Record<string, string> = {
  Imported: "Đã nhập",
  Active: "Đang dùng",
  Draft: "Bản nháp",
  Archived: "Đã lưu trữ",
  Partial: "Một phần",
  Success: "Thành công",
  Failed: "Thất bại",
  Error: "Lỗi",
  Completed: "Hoàn tất",
  Pending: "Đang chờ",
  Ready: "Sẵn sàng"
};

export const canvasNodeWidth = 184;
export const canvasNodeHeight = 76;
export const variableNodeType = "Variable";
