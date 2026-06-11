import type { DropdownOption } from "@/components/dropdown-select";
import { displayStatus } from "@/lib/labels";
import { readableError } from "@/lib/toast";
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
  const message = readableError(error, fallback);
  const lower = message.toLowerCase();
  if (lower.includes("variable code") && lower.includes("already exists")) {
    return "Mã biến đã tồn tại trong mô hình này.";
  }
  if (lower.includes("scale type is invalid")) {
    return "Loại thang đo không hợp lệ theo contract NCKH hiện tại.";
  }
  if (lower.includes("likert scalepoint")) {
    return "Điểm thang Likert phải nằm trong khoảng 2 đến 10.";
  }
  if (lower.includes("scale scaletype requires minvalue and maxvalue")) {
    return "Thang tuyến tính cần đủ giá trị nhỏ nhất và lớn nhất.";
  }
  if (lower.includes("scale scaletype must not include scalepoint")) {
    return "Thang tuyến tính không dùng trường điểm thang đo.";
  }
  if (lower.includes("minvalue") && lower.includes("maxvalue")) {
    return "Giá trị nhỏ nhất và lớn nhất của thang đo chưa hợp lệ.";
  }
  if (lower.includes("nominal and ordinal")) {
    return "Thang định danh và thứ bậc không dùng điểm thang đo hoặc min/max.";
  }
  if (lower.includes("scope") || lower.includes("consent") || lower.includes("permission") || lower.includes("forbidden") || lower.includes("403")) {
    return "Tài khoản Google chưa cấp đủ quyền cần thiết cho thao tác này.";
  }
  if (lower.includes("unauthorized") || lower.includes("not linked") || lower.includes("401")) {
    return "Bạn cần liên kết lại tài khoản Google trước khi tiếp tục.";
  }
  if (lower.includes("conflict") || lower.includes("409") || lower.includes("stale")) {
    return "Dữ liệu hiện tại không còn đồng bộ. Hãy tải lại hoặc chuẩn hóa lại trước khi tiếp tục.";
  }
  if (lower.includes("not found") || lower.includes("404")) {
    return "Không tìm thấy dữ liệu NCKH cần thao tác.";
  }
  if (lower.includes("invalid") || lower.includes("expired")) {
    return "Dữ liệu gửi lên chưa hợp lệ. Vui lòng kiểm tra lại các trường trong form.";
  }
  return /[à-ỹđ]/i.test(message) ? message : fallback;
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

  return { error: "Loại thang đo không hợp lệ theo contract NCKH hiện tại." };
}
