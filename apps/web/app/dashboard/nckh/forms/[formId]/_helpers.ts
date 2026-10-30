import type { DropdownOption } from "@/components/dropdown-select";
import { displayStatus } from "@/lib/labels";
import { readableError } from "@/lib/toast";
import { ApiError } from "@/lib/api";
import { NckhGoogleAuthorizationError } from "@/lib/nckh-google-auth";
import {
  nckhStatusLabels,
  questionTypeLabels,
  relationDirectionLabels,
  scaleTypeLabels,
  variableTypeLabels
} from "./_constants";
import type { CanvasNodeSize, CanvasPosition } from "./_types";

export function nextAvailableCanvasPosition(
  currentPositions: Record<string, CanvasPosition>,
  positionForIndex: (index: number) => CanvasPosition,
  size: CanvasNodeSize
) {
  for (let index = 0; index < 80; index += 1) {
    const candidate = positionForIndex(index);
    if (!Object.values(currentPositions).some((position) => canvasPositionsOverlap(candidate, size, position))) {
      return candidate;
    }
  }

  return positionForIndex(Object.keys(currentPositions).length);
}

export function canvasPositionsOverlap(candidate: CanvasPosition, candidateSize: CanvasNodeSize, existing: CanvasPosition) {
  const padding = 24;
  return Math.abs(candidate.x - existing.x) < candidateSize.width + padding
    && Math.abs(candidate.y - existing.y) < candidateSize.height + padding;
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

export function displayVariableType(value: string) {
  return variableTypeLabels[value] ?? value;
}

export function displayScaleType(value: string) {
  return scaleTypeLabels[value] ?? value;
}

export function displayRelationDirection(value: string) {
  return relationDirectionLabels[value] ?? value;
}

export function relationTone(direction: string): "success" | "warning" {
  return direction === "Positive" ? "success" : "warning";
}

export function displayQuestionType(value: string) {
  return questionTypeLabels[value] ?? value;
}

export function displayNckhStatus(value?: string | null) {
  if (!value) return "-";
  return nckhStatusLabels[value] ?? displayStatus(value);
}

export function displayCollectionStatus(value: string) {
  return displayNckhStatus(value);
}

export function filterDropdownOptions(options: DropdownOption[], searchValue: string) {
  const normalized = searchValue.trim().toLowerCase();
  if (!normalized) return options;
  return options.filter((option) => option.label.toLowerCase().includes(normalized));
}

export function readableNckhError(error: unknown, fallback: string) {
  if (error instanceof NckhGoogleAuthorizationError) {
    return "Bạn cần liên kết lại tài khoản Google trước khi tiếp tục.";
  }
  if (error instanceof ApiError && error.path.startsWith("/api/v1/nckh/")) {
    if (error.status === 400 && error.method === "POST" && error.path === "/api/v1/nckh/forms/import") {
      return "Chưa nhập được biểu mẫu. Vui lòng kiểm tra liên kết Google Form và quyền truy cập biểu mẫu.";
    }
    if (error.status === 409 && error.path === "/api/v1/nckh/forms/import") {
      return "Chưa nhập được biểu mẫu. Hãy kiểm tra danh sách biểu mẫu đã nhập trước khi thử lại.";
    }
    if (error.status === 409 && /\/models\/[^/]+\/relations$/.test(error.path)) {
      return "Chưa thêm được quan hệ. Hãy kiểm tra các quan hệ đã có trong mô hình.";
    }
    if (error.status === 409 && /\/models\/[^/]+\/export$/.test(error.path)) {
      return "Chưa xuất được dữ liệu. Hãy kiểm tra bộ dữ liệu và chuẩn hóa lại nếu dữ liệu đã cũ.";
    }
  }
  return readableError(error, fallback);
}

function toOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function buildVariableScalePayload(scaleType: string, scalePointValue: string, minValueValue: string, maxValueValue: string) {
  if (scaleType === "Likert") {
    const scalePoint = toOptionalNumber(scalePointValue);
    if (scalePoint === null || !Number.isInteger(scalePoint) || scalePoint < 2 || scalePoint > 10) {
      return { error: "Điểm thang Likert phải là số nguyên từ 2 đến 10." };
    }

    return { scalePoint, minValue: null, maxValue: null };
  }

  if (scaleType === "Scale") {
    const minValue = toOptionalNumber(minValueValue);
    const maxValue = toOptionalNumber(maxValueValue);
    if (minValue === null || maxValue === null || Number.isNaN(minValue) || Number.isNaN(maxValue)) {
      return { error: "Thang tuyến tính cần đủ giá trị nhỏ nhất và lớn nhất." };
    }
    if (minValue >= maxValue) {
      return { error: "Giá trị nhỏ nhất phải nhỏ hơn giá trị lớn nhất." };
    }

    return { scalePoint: null, minValue, maxValue };
  }

  if (scaleType === "Nominal" || scaleType === "Ordinal") {
    return { scalePoint: null, minValue: null, maxValue: null };
  }

  return { error: "Loại thang đo chưa hợp lệ. Vui lòng chọn lại thang đo." };
}
