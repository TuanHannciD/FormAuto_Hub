"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Handle,
  Position,
  ReactFlow,
  applyNodeChanges,
  type Connection,
  type Edge,
  type Node,
  type NodeChange
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  Database,
  Download,
  FileDown,
  FileText,
  GitBranch,
  Layers3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { DropdownSelect, type DropdownOption } from "@/components/dropdown-select";
import { PaginationControls } from "@/components/pagination-controls";
import { SearchableDropdownSelect } from "@/components/searchable-dropdown-select";
import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, KeyValueRow, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import {
  apiFetch,
  apiFetchBlob,
  type NckhCollectResponsesResponse,
  type NckhDatasetListResponse,
  type NckhFormDetailResponse,
  type NckhFormQuestion,
  type NckhGenerateFormResponse,
  type NckhMapping,
  type NckhMappingListResponse,
  type NckhNormalizeResponsesResponse,
  type NckhPosition,
  type NckhPositionListResponse,
  type NckhRawResponse,
  type NckhRawResponseListResponse,
  type NckhRelation,
  type NckhRelationListResponse,
  type NckhResearchModel,
  type NckhResearchModelListResponse,
  type NckhVariable,
  type NckhVariableListResponse
} from "@/lib/api";
import { displayStatus } from "@/lib/labels";
import { readableError } from "@/lib/toast";

type WorkspaceTab = "overview" | "variables" | "mapping" | "canvas" | "generate" | "data" | "export";

type PendingAction =
  | "createModel"
  | "activateModel"
  | "deleteModel"
  | "createVariable"
  | "deleteVariable"
  | "createMapping"
  | "deleteMapping"
  | "createRelation"
  | "updateRelation"
  | "savePositions"
  | "deleteRelation"
  | "generateForm"
  | "collectResponses"
  | "normalizeResponses"
  | "exportCsv"
  | "exportCodebook"
  | "exportSpss";

type DatasetPreviewRow = NckhDatasetListResponse["items"][number] & {
  previewKey: string;
};

type CanvasPosition = { x: number; y: number };
type CanvasModal = "variables" | "mapping" | null;

const tabs: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "overview", label: "Tổng quan" },
  { id: "canvas", label: "Sơ đồ quan hệ" },
  { id: "generate", label: "Tạo form" },
  { id: "data", label: "Dữ liệu" },
  { id: "export", label: "Xuất dữ liệu" }
];

const variableTypes = ["Independent", "Dependent", "Mediator", "Moderator", "Control"];
const scaleTypes = ["Likert", "Ordinal", "Nominal", "Scale"];
const relationDirections = ["Positive", "Negative"];

const variableTypeLabels: Record<string, string> = {
  Independent: "Biến độc lập",
  Dependent: "Biến phụ thuộc",
  Mediator: "Biến trung gian",
  Moderator: "Biến điều tiết",
  Control: "Biến kiểm soát"
};

const scaleTypeLabels: Record<string, string> = {
  Likert: "Thang Likert",
  Ordinal: "Thứ bậc",
  Nominal: "Định danh",
  Scale: "Thang tuyến tính"
};

const relationDirectionLabels: Record<string, string> = {
  Positive: "Cùng chiều",
  Negative: "Ngược chiều"
};

const canvasNodeWidth = 184;
const canvasNodeHeight = 76;
const canvasRelationWidth = 176;
const canvasRelationHeight = 68;
const variableNodeType = "Variable";
const relationNodeType = "Relation";

const questionTypeLabels: Record<string, string> = {
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

const nckhStatusLabels: Record<string, string> = {
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

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

function displayVariableType(value: string) {
  return variableTypeLabels[value] ?? value;
}

function displayScaleType(value: string) {
  return scaleTypeLabels[value] ?? value;
}

function displayRelationDirection(value: string) {
  return relationDirectionLabels[value] ?? value;
}

function relationTone(direction: string): "success" | "warning" {
  return direction === "Positive" ? "success" : "warning";
}

function displayQuestionType(value: string) {
  return questionTypeLabels[value] ?? value;
}

function displayNckhStatus(value?: string | null) {
  if (!value) return "-";
  return nckhStatusLabels[value] ?? displayStatus(value);
}

function displayCollectionStatus(value: string) {
  return displayNckhStatus(value);
}

function filterDropdownOptions(options: DropdownOption[], searchValue: string) {
  const normalized = searchValue.trim().toLowerCase();
  if (!normalized) return options;
  return options.filter((option) => option.label.toLowerCase().includes(normalized));
}

function readableNckhError(error: unknown, fallback: string) {
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

function buildVariableScalePayload(scaleType: string, scalePointValue: string, minValueValue: string, maxValueValue: string) {
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

export default function NckhFormWorkspacePage() {
  const params = useParams<{ formId: string }>();
  const router = useRouter();
  const formId = params.formId;

  const [form, setForm] = useState<NckhFormDetailResponse | null>(null);
  const [models, setModels] = useState<NckhResearchModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [tab, setTab] = useState<WorkspaceTab>("overview");
  const [canvasModal, setCanvasModal] = useState<CanvasModal>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingModel, setIsSavingModel] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const pendingActionRef = useRef<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [modelName, setModelName] = useState("");
  const [modelDescription, setModelDescription] = useState("");

  const [variables, setVariables] = useState<NckhVariable[]>([]);
  const [mappings, setMappings] = useState<NckhMapping[]>([]);
  const [relations, setRelations] = useState<NckhRelation[]>([]);
  const [positions, setPositions] = useState<NckhPosition[]>([]);
  const [responses, setResponses] = useState<NckhRawResponseListResponse | null>(null);
  const [dataset, setDataset] = useState<NckhDatasetListResponse | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [isPanelLoading, setIsPanelLoading] = useState(false);
  const [lastGenerate, setLastGenerate] = useState<NckhGenerateFormResponse | null>(null);
  const [lastCollect, setLastCollect] = useState<NckhCollectResponsesResponse | null>(null);
  const [lastNormalize, setLastNormalize] = useState<NckhNormalizeResponsesResponse | null>(null);

  const [variableDraft, setVariableDraft] = useState({
    name: "",
    code: "",
    variableType: "Independent",
    scaleType: "Likert",
    scalePoint: "5",
    minValue: "",
    maxValue: "",
    sortOrder: "1"
  });
  const [mappingDraft, setMappingDraft] = useState({ variableId: "", formQuestionId: "", observedCode: "", sortOrder: "1" });
  const [relationDraft, setRelationDraft] = useState({ fromVariableId: "", toVariableId: "", direction: "Positive", sortOrder: "1" });
  const [mappingVariableSearch, setMappingVariableSearch] = useState("");
  const [mappingQuestionSearch, setMappingQuestionSearch] = useState("");
  const [relationFromSearch, setRelationFromSearch] = useState("");
  const [relationToSearch, setRelationToSearch] = useState("");
  const [canvasPositions, setCanvasPositions] = useState<Record<string, CanvasPosition>>({});

  const selectedModel = useMemo(
    () => models.find((item) => item.id === selectedModelId) ?? null,
    [models, selectedModelId]
  );
  const canEditCanvas = selectedModel?.status === "Draft";

  useEffect(() => {
    const nextPositions: Record<string, CanvasPosition> = {};
    variables.forEach((variable, index) => {
      const saved = positions.find((item) => item.nodeType === variableNodeType && item.variableId === variable.id);
      nextPositions[canvasNodeId(variableNodeType, variable.id)] = saved ? { x: saved.positionX, y: saved.positionY } : defaultVariablePosition(index);
    });
    relations.forEach((relation, index) => {
      const saved = positions.find((item) => item.nodeType === relationNodeType && item.relationId === relation.id);
      nextPositions[canvasNodeId(relationNodeType, relation.id)] = saved ? { x: saved.positionX, y: saved.positionY } : defaultRelationPosition(index);
    });
    setCanvasPositions(nextPositions);
  }, [positions, relations, variables]);

  const onCanvasNodesChange = useCallback((changes: NodeChange[]) => {
    if (!canEditCanvas) return;
    setCanvasPositions((current) => {
      const nodeSnapshot = Object.entries(current).map(([id, position]) => ({ id, position, data: {} }) satisfies Node);
      const updatedNodes = applyNodeChanges(changes, nodeSnapshot);
      const next = { ...current };
      updatedNodes.forEach((node) => {
        next[node.id] = { x: node.position.x, y: node.position.y };
      });
      return next;
    });
  }, [canEditCanvas]);

  const beginPendingAction = useCallback((action: PendingAction) => {
    if (pendingActionRef.current) return false;
    pendingActionRef.current = action;
    setPendingAction(action);
    return true;
  }, []);

  const endPendingAction = useCallback((action: PendingAction) => {
    if (pendingActionRef.current !== action) return;
    pendingActionRef.current = null;
    setPendingAction(null);
  }, []);

  const isActionPending = useCallback(
    (action: PendingAction) => pendingAction === action,
    [pendingAction]
  );

  const hasPendingAction = pendingAction !== null;

  const resetRelationDraft = useCallback((sortOrder = "1") => {
    setRelationDraft({ fromVariableId: "", toVariableId: "", direction: "Positive", sortOrder });
    setRelationFromSearch("");
    setRelationToSearch("");
  }, []);

  const variableTypeOptions = useMemo<DropdownOption[]>(
    () => variableTypes.map((item) => ({ value: item, label: displayVariableType(item) })),
    []
  );

  const scaleTypeOptions = useMemo<DropdownOption[]>(
    () => scaleTypes.map((item) => ({ value: item, label: displayScaleType(item) })),
    []
  );

  const relationDirectionOptions = useMemo<DropdownOption[]>(
    () => relationDirections.map((item) => ({ value: item, label: displayRelationDirection(item) })),
    []
  );

  const variableOptions = useMemo<DropdownOption[]>(
    () => variables.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` })),
    [variables]
  );

  const questionOptions = useMemo<DropdownOption[]>(
    () => (form?.questions ?? []).map((item) => ({ value: item.id, label: `${item.orderIndex}. ${item.questionText}` })),
    [form?.questions]
  );

  const filteredMappingVariableOptions = useMemo(
    () => filterDropdownOptions(variableOptions, mappingVariableSearch),
    [mappingVariableSearch, variableOptions]
  );

  const filteredMappingQuestionOptions = useMemo(
    () => filterDropdownOptions(questionOptions, mappingQuestionSearch),
    [mappingQuestionSearch, questionOptions]
  );

  const filteredRelationFromOptions = useMemo(
    () => filterDropdownOptions(variableOptions, relationFromSearch),
    [relationFromSearch, variableOptions]
  );

  const filteredRelationToOptions = useMemo(
    () => filterDropdownOptions(variableOptions, relationToSearch),
    [relationToSearch, variableOptions]
  );

  const relationDraftError = useMemo(() => {
    if (!relationDraft.fromVariableId || !relationDraft.toVariableId) {
      return "Chọn đủ biến nguồn và biến đích trước khi thêm quan hệ.";
    }

    if (relationDraft.fromVariableId === relationDraft.toVariableId) {
      return "Biến nguồn và biến đích phải khác nhau.";
    }

    const alreadyExists = relations.some((relation) => (
      relation.fromVariableId === relationDraft.fromVariableId
      && relation.toVariableId === relationDraft.toVariableId
    ));
    return alreadyExists ? "Quan hệ có hướng này đã tồn tại trong mô hình." : null;
  }, [relationDraft.fromVariableId, relationDraft.toVariableId, relations]);

  const showRelationDraftError = Boolean(relationDraft.fromVariableId || relationDraft.toVariableId) && relationDraftError;

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [formResult, modelResult] = await Promise.all([
        apiFetch<NckhFormDetailResponse>(`/api/v1/nckh/forms/${formId}`),
        apiFetch<NckhResearchModelListResponse>("/api/v1/nckh/models?page=1&pageSize=100")
      ]);
      const formModels = modelResult.items.filter((item) => item.formId === formId);
      setForm(formResult);
      setModels(formModels);
      setSelectedModelId((current) => current || formModels.find((item) => item.status === "Active")?.id || formModels[0]?.id || "");
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Không tải được không gian làm việc NCKH.";
      setError(readableNckhError(message, "Không tải được không gian làm việc NCKH."));
    } finally {
      setIsLoading(false);
    }
  }, [formId]);

  const loadModelData = useCallback(async (modelId: string) => {
    if (!modelId) return;
    setIsPanelLoading(true);
    setPanelError(null);
    try {
      const [variableResult, mappingResult, relationResult, positionResult, responseResult, datasetResult] = await Promise.allSettled([
        apiFetch<NckhVariableListResponse>(`/api/v1/nckh/models/${modelId}/variables?page=1&pageSize=100`),
        apiFetch<NckhMappingListResponse>(`/api/v1/nckh/models/${modelId}/mappings?page=1&pageSize=100`),
        apiFetch<NckhRelationListResponse>(`/api/v1/nckh/models/${modelId}/relations?page=1&pageSize=100`),
        apiFetch<NckhPositionListResponse>(`/api/v1/nckh/models/${modelId}/positions`),
        apiFetch<NckhRawResponseListResponse>(`/api/v1/nckh/models/${modelId}/responses?page=1&pageSize=20`),
        apiFetch<NckhDatasetListResponse>(`/api/v1/nckh/models/${modelId}/dataset?page=1&pageSize=20`)
      ]);

      if (variableResult.status === "fulfilled") setVariables(variableResult.value.items);
      if (mappingResult.status === "fulfilled") setMappings(mappingResult.value.items);
      if (relationResult.status === "fulfilled") setRelations(relationResult.value.items);
      if (positionResult.status === "fulfilled") setPositions(positionResult.value.items);
      if (responseResult.status === "fulfilled") setResponses(responseResult.value);
      if (datasetResult.status === "fulfilled") setDataset(datasetResult.value);

      const firstFailure = [variableResult, mappingResult, relationResult, positionResult, responseResult, datasetResult]
        .find((result) => result.status === "rejected") as PromiseRejectedResult | undefined;
      if (firstFailure) {
        const message = firstFailure.reason instanceof Error ? firstFailure.reason.message : "Một phần dữ liệu chưa sẵn sàng.";
        setPanelError(readableNckhError(message, "Một phần dữ liệu chưa sẵn sàng."));
      }
    } finally {
      setIsPanelLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    resetRelationDraft();
    if (selectedModelId) {
      loadModelData(selectedModelId);
    } else {
      setVariables([]);
      setMappings([]);
      setRelations([]);
      setPositions([]);
      setResponses(null);
      setDataset(null);
    }
  }, [loadModelData, resetRelationDraft, selectedModelId]);

  async function createModel(event: FormEvent) {
    event.preventDefault();
    if (!modelName.trim()) return;
    if (!beginPendingAction("createModel")) return;
    setIsSavingModel(true);
    try {
      const created = await apiFetch<NckhResearchModel>("/api/v1/nckh/models", {
        method: "POST",
        json: { formId, name: modelName.trim(), description: modelDescription.trim() || null }
      });
      toast.success("Đã tạo mô hình nghiên cứu.");
      setModelName("");
      setModelDescription("");
      await loadWorkspace();
      setSelectedModelId(created.id);
    } catch (createError) {
      toast.error(readableNckhError(createError, "Không tạo được mô hình."));
    } finally {
      setIsSavingModel(false);
      endPendingAction("createModel");
    }
  }

  async function activateModel(modelId: string) {
    if (!beginPendingAction("activateModel")) return;
    try {
      await apiFetch<NckhResearchModel>(`/api/v1/nckh/models/${modelId}/activate`, { method: "POST" });
      toast.success("Đã kích hoạt mô hình.");
      await loadWorkspace();
    } catch (activationError) {
      toast.error(readableNckhError(activationError, "Không kích hoạt được mô hình."));
    } finally {
      endPendingAction("activateModel");
    }
  }

  async function deleteModel(model: NckhResearchModel) {
    if (!window.confirm(`Xóa mô hình "${model.name}"? Các dữ liệu liên quan sẽ bị xử lý theo quy tắc xóa hiện có của backend.`)) return;
    if (!beginPendingAction("deleteModel")) return;
    try {
      await apiFetch<void>(`/api/v1/nckh/models/${model.id}`, { method: "DELETE" });
      toast.success("Đã xóa mô hình.");
      setSelectedModelId("");
      await loadWorkspace();
    } catch (deleteError) {
      toast.error(readableNckhError(deleteError, "Không xóa được mô hình."));
    } finally {
      endPendingAction("deleteModel");
    }
  }

  async function createVariable(event: FormEvent) {
    event.preventDefault();
    if (!selectedModelId) return;
    if (!canEditCanvas) {
      toast.error("Chỉ có thể thêm biến khi mô hình còn là bản nháp.");
      return;
    }
    const scalePayload = buildVariableScalePayload(
      variableDraft.scaleType,
      variableDraft.scalePoint,
      variableDraft.minValue,
      variableDraft.maxValue
    );
    if (scalePayload.error) {
      toast.error(scalePayload.error);
      return;
    }
    if (!beginPendingAction("createVariable")) return;
    try {
      await apiFetch<NckhVariable>(`/api/v1/nckh/models/${selectedModelId}/variables`, {
        method: "POST",
        json: {
          name: variableDraft.name.trim(),
          code: variableDraft.code.trim(),
          variableType: variableDraft.variableType,
          scaleType: variableDraft.scaleType,
          scalePoint: scalePayload.scalePoint,
          minValue: scalePayload.minValue,
          maxValue: scalePayload.maxValue,
          sortOrder: Number(variableDraft.sortOrder || "1")
        }
      });
      toast.success("Đã thêm biến.");
      setVariableDraft({ ...variableDraft, name: "", code: "", sortOrder: String(variables.length + 2) });
      await loadModelData(selectedModelId);
    } catch (variableError) {
      toast.error(readableNckhError(variableError, "Không thêm được biến."));
    } finally {
      endPendingAction("createVariable");
    }
  }

  async function deleteVariable(variable: NckhVariable) {
    if (!canEditCanvas) {
      toast.error("Chỉ có thể xóa biến khi mô hình còn là bản nháp.");
      return;
    }
    if (!window.confirm(`Xóa biến "${variable.name}"? Các ánh xạ liên quan sẽ bị xóa theo contract hiện có của backend.`)) return;
    if (!beginPendingAction("deleteVariable")) return;
    try {
      await apiFetch<void>(`/api/v1/nckh/variables/${variable.id}`, { method: "DELETE" });
      toast.success("Đã xóa biến.");
      if (relationDraft.fromVariableId === variable.id || relationDraft.toVariableId === variable.id) {
        resetRelationDraft(String(Math.max(1, relations.length)));
      }
      await loadModelData(selectedModelId);
    } catch (deleteError) {
      toast.error(readableNckhError(deleteError, "Không xóa được biến."));
    } finally {
      endPendingAction("deleteVariable");
    }
  }

  async function createMapping(event: FormEvent) {
    event.preventDefault();
    if (!selectedModelId || !mappingDraft.variableId || !mappingDraft.formQuestionId) return;
    if (!canEditCanvas) {
      toast.error("Chỉ có thể thêm ánh xạ khi mô hình còn là bản nháp.");
      return;
    }
    if (!beginPendingAction("createMapping")) return;
    try {
      await apiFetch<NckhMapping>(`/api/v1/nckh/variables/${mappingDraft.variableId}/mappings`, {
        method: "POST",
        json: {
          formQuestionId: mappingDraft.formQuestionId,
          observedCode: mappingDraft.observedCode.trim(),
          sortOrder: Number(mappingDraft.sortOrder || "1")
        }
      });
      toast.success("Đã thêm ánh xạ.");
      setMappingDraft({ variableId: mappingDraft.variableId, formQuestionId: "", observedCode: "", sortOrder: String(mappings.length + 2) });
      setMappingQuestionSearch("");
      await loadModelData(selectedModelId);
    } catch (mappingError) {
      toast.error(readableNckhError(mappingError, "Không thêm được ánh xạ."));
    } finally {
      endPendingAction("createMapping");
    }
  }

  async function deleteMapping(mapping: NckhMapping) {
    if (!canEditCanvas) {
      toast.error("Chỉ có thể xóa ánh xạ khi mô hình còn là bản nháp.");
      return;
    }
    if (!window.confirm(`Xóa ánh xạ "${mapping.observedCode}"?`)) return;
    if (!beginPendingAction("deleteMapping")) return;
    try {
      await apiFetch<void>(`/api/v1/nckh/mappings/${mapping.id}`, { method: "DELETE" });
      toast.success("Đã xóa ánh xạ.");
      await loadModelData(selectedModelId);
    } catch (deleteError) {
      toast.error(readableNckhError(deleteError, "Không xóa được ánh xạ."));
    } finally {
      endPendingAction("deleteMapping");
    }
  }

  async function createRelation(event: FormEvent) {
    event.preventDefault();
    if (!selectedModelId) return;
    if (relationDraftError) {
      toast.error(relationDraftError);
      return;
    }
    if (!canEditCanvas) {
      toast.error("Chỉ có thể chỉnh sửa quan hệ và vị trí khi mô hình còn là bản nháp.");
      return;
    }
    await createRelationFromPayload({
      fromVariableId: relationDraft.fromVariableId,
      toVariableId: relationDraft.toVariableId,
      direction: relationDraft.direction,
      sortOrder: Number(relationDraft.sortOrder || "1")
    });
  }

  async function createRelationFromPayload(payload: { fromVariableId: string; toVariableId: string; direction: string; sortOrder: number }) {
    if (!selectedModelId) return;
    if (!beginPendingAction("createRelation")) return;
    try {
      await apiFetch<NckhRelation>(`/api/v1/nckh/models/${selectedModelId}/relations`, {
        method: "POST",
        json: payload
      });
      toast.success("Đã thêm quan hệ.");
      resetRelationDraft(String(relations.length + 2));
      await loadModelData(selectedModelId);
    } catch (relationError) {
      toast.error(readableNckhError(relationError, "Không thêm được quan hệ."));
    } finally {
      endPendingAction("createRelation");
    }
  }

  async function createRelationFromConnection(connection: Connection) {
    if (!selectedModelId || !connection.source || !connection.target) return;
    if (!canEditCanvas) {
      toast.error("Chỉ có thể nối quan hệ khi mô hình còn là bản nháp.");
      return;
    }
    const fromVariableId = variableIdFromCanvasNode(connection.source);
    const toVariableId = variableIdFromCanvasNode(connection.target);
    if (!fromVariableId || !toVariableId) return;
    if (fromVariableId === toVariableId) {
      toast.error("Biến nguồn và biến đích phải khác nhau.");
      return;
    }
    const alreadyExists = relations.some((relation) => relation.fromVariableId === fromVariableId && relation.toVariableId === toVariableId);
    if (alreadyExists) {
      toast.error("Quan hệ có hướng này đã tồn tại trong mô hình.");
      return;
    }
    await createRelationFromPayload({
      fromVariableId,
      toVariableId,
      direction: "Positive",
      sortOrder: relations.length + 1
    });
  }

  async function updateRelationDirection(relation: NckhRelation, direction: string) {
    if (!canEditCanvas) {
      toast.error("Chỉ có thể chỉnh sửa quan hệ khi mô hình còn là bản nháp.");
      return;
    }
    if (relation.direction === direction) return;
    if (!beginPendingAction("updateRelation")) return;
    try {
      await apiFetch<NckhRelation>(`/api/v1/nckh/relations/${relation.id}`, {
        method: "PUT",
        json: {
          fromVariableId: relation.fromVariableId,
          toVariableId: relation.toVariableId,
          direction,
          sortOrder: relation.sortOrder
        }
      });
      toast.success("Đã cập nhật hướng quan hệ.");
      await loadModelData(selectedModelId);
    } catch (updateError) {
      toast.error(readableNckhError(updateError, "Không cập nhật được quan hệ."));
    } finally {
      endPendingAction("updateRelation");
    }
  }

  async function saveDefaultPositions() {
    if (!selectedModelId) return;
    if (!canEditCanvas) {
      toast.error("Chỉ có thể chỉnh sửa quan hệ và vị trí khi mô hình còn là bản nháp.");
      return;
    }
    if (!beginPendingAction("savePositions")) return;
    const variablePositions = variables.map((variable, index) => ({
      nodeType: variableNodeType,
      variableId: variable.id,
      relationId: null,
      positionX: currentCanvasPosition(variableNodeType, variable.id, index).x,
      positionY: currentCanvasPosition(variableNodeType, variable.id, index).y
    }));
    const relationPositions = relations.map((relation, index) => ({
      nodeType: relationNodeType,
      variableId: null,
      relationId: relation.id,
      positionX: currentCanvasPosition(relationNodeType, relation.id, index).x,
      positionY: currentCanvasPosition(relationNodeType, relation.id, index).y
    }));
    try {
      await apiFetch<NckhPositionListResponse>(`/api/v1/nckh/models/${selectedModelId}/positions`, {
        method: "PUT",
        json: { positions: [...variablePositions, ...relationPositions] }
      });
      toast.success("Đã lưu vị trí canvas mặc định.");
      await loadModelData(selectedModelId);
    } catch (positionError) {
      toast.error(readableNckhError(positionError, "Không lưu được vị trí sơ đồ."));
    } finally {
      endPendingAction("savePositions");
    }
  }

  function defaultVariablePosition(index: number) {
    return {
      x: 32 + (index % 3) * 232,
      y: 88 + Math.floor(index / 3) * 132
    };
  }

  function defaultRelationPosition(index: number) {
    return {
      x: 128 + (index % 3) * 232,
      y: 188 + Math.floor(index / 3) * 132
    };
  }

  function canvasNodeId(nodeType: string, id: string) {
    return `${nodeType}:${id}`;
  }

  function variableIdFromCanvasNode(nodeId: string) {
    return nodeId.startsWith(`${variableNodeType}:`) ? nodeId.slice(variableNodeType.length + 1) : null;
  }

  function currentCanvasPosition(nodeType: string, id: string, index: number) {
    const key = canvasNodeId(nodeType, id);
    if (canvasPositions[key]) return canvasPositions[key];
    return nodeType === variableNodeType ? savedVariablePosition(id, index) : savedRelationPosition(id, index);
  }

  function savedVariablePosition(variableId: string, index: number) {
    const saved = positions.find((item) => item.nodeType === variableNodeType && item.variableId === variableId);
    return saved ? { x: saved.positionX, y: saved.positionY } : defaultVariablePosition(index);
  }

  function savedRelationPosition(relationId: string, index: number) {
    const saved = positions.find((item) => item.nodeType === relationNodeType && item.relationId === relationId);
    return saved ? { x: saved.positionX, y: saved.positionY } : defaultRelationPosition(index);
  }

  async function deleteRelation(relation: NckhRelation) {
    if (!canEditCanvas) {
      toast.error("Chỉ có thể chỉnh sửa quan hệ và vị trí khi mô hình còn là bản nháp.");
      return;
    }
    if (!window.confirm(`Xóa quan hệ "${relation.hypothesisCode}"?`)) return;
    if (!beginPendingAction("deleteRelation")) return;
    try {
      await apiFetch<void>(`/api/v1/nckh/relations/${relation.id}`, { method: "DELETE" });
      toast.success("Đã xóa quan hệ.");
      resetRelationDraft(String(Math.max(1, relations.length)));
      await loadModelData(selectedModelId);
    } catch (deleteError) {
      toast.error(readableNckhError(deleteError, "Không xóa được quan hệ."));
    } finally {
      endPendingAction("deleteRelation");
    }
  }

  async function generateForm() {
    if (!selectedModelId) return;
    if (!beginPendingAction("generateForm")) return;
    const action = selectedModel?.hasGeneratedForm ? "Update" : "Create";
    try {
      const result = await apiFetch<NckhGenerateFormResponse>(`/api/v1/nckh/models/${selectedModelId}/generate-form`, {
        method: "POST",
        json: { action }
      });
      setLastGenerate(result);
      setModels((current) => current.map((item) => item.id === selectedModelId ? { ...item, hasGeneratedForm: true } : item));
      toast.success(action === "Update" ? "Đã gửi yêu cầu cập nhật Google Form." : "Đã gửi yêu cầu tạo Google Form.");
    } catch (generateError) {
      toast.error(readableNckhError(generateError, selectedModel?.hasGeneratedForm ? "Không cập nhật được Google Form." : "Không tạo được Google Form."));
    } finally {
      endPendingAction("generateForm");
    }
  }

  async function collectResponses() {
    if (!selectedModelId) return;
    if (!beginPendingAction("collectResponses")) return;
    try {
      const result = await apiFetch<NckhCollectResponsesResponse>(`/api/v1/nckh/models/${selectedModelId}/collect`, { method: "POST" });
      setLastCollect(result);
      toast.success("Đã chạy thu thập phản hồi.");
      await loadModelData(selectedModelId);
    } catch (collectError) {
      toast.error(readableNckhError(collectError, "Không thu thập được phản hồi."));
    } finally {
      endPendingAction("collectResponses");
    }
  }

  async function normalizeResponses() {
    if (!selectedModelId) return;
    if (!beginPendingAction("normalizeResponses")) return;
    try {
      const result = await apiFetch<NckhNormalizeResponsesResponse>(`/api/v1/nckh/models/${selectedModelId}/normalize`, { method: "POST" });
      setLastNormalize(result);
      toast.success("Đã chuẩn hóa dữ liệu.");
      await loadModelData(selectedModelId);
    } catch (normalizeError) {
      toast.error(readableNckhError(normalizeError, "Không chuẩn hóa được dữ liệu."));
    } finally {
      endPendingAction("normalizeResponses");
    }
  }

  async function downloadExport(format: "csv" | "codebook" | "spss") {
    if (!selectedModelId) return;
    const action = format === "csv" ? "exportCsv" : format === "codebook" ? "exportCodebook" : "exportSpss";
    if (!beginPendingAction(action)) return;
    try {
      const blob = await apiFetchBlob(`/api/v1/nckh/models/${selectedModelId}/export?format=${format}`);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nckh-${selectedModelId}.${format === "codebook" ? "xlsx" : format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Đã tải file xuất dữ liệu.");
    } catch (exportError) {
      const message = exportError instanceof Error ? exportError.message : "";
      const detail = dataset?.hasStaleData
        ? "Bộ dữ liệu đã cũ. Hãy chuẩn hóa lại trước khi xuất dữ liệu."
        : "Không xuất được file.";
      toast.error(readableNckhError(message, detail));
    } finally {
      endPendingAction(action);
    }
  }

  const questionColumns: BaseTableColumn<NckhFormQuestion>[] = [
    { key: "order", header: "#", render: (item) => item.orderIndex, className: "w-14" },
    { key: "text", header: "Câu hỏi", render: (item) => item.questionText },
    { key: "type", header: "Loại", render: (item) => <Badge tone="info">{displayQuestionType(item.questionType)}</Badge> },
    { key: "required", header: "Bắt buộc", render: (item) => (item.isRequired ? "Có" : "Không") }
  ];

  const modelColumns: BaseTableColumn<NckhResearchModel>[] = [
    { key: "name", header: "Mô hình", render: (item) => <button className="font-semibold text-primary hover:underline" type="button" onClick={() => setSelectedModelId(item.id)}>{item.name}</button> },
    { key: "status", header: "Trạng thái", render: (item) => <StatusBadge status={item.status} /> },
    { key: "variables", header: "Biến", render: (item) => item.variableCount },
    { key: "updated", header: "Cập nhật", render: (item) => formatDate(item.updatedAt) },
    {
      key: "actions",
      header: "Thao tác",
      render: (item) => (
        <div className="flex flex-wrap gap-2">
          <Button className="min-h-8 px-2 py-1" variant="secondary" type="button" disabled={hasPendingAction} onClick={() => setSelectedModelId(item.id)}>Mở</Button>
          <Button className="min-h-8 px-2 py-1" variant="secondary" type="button" disabled={hasPendingAction || item.status === "Active"} onClick={() => activateModel(item.id)}>
            {isActionPending("activateModel") ? <Loader2 className="animate-spin" size={14} /> : "Kích hoạt"}
          </Button>
          <Button className="min-h-8 px-2 py-1" variant="danger" type="button" disabled={hasPendingAction} onClick={() => deleteModel(item)}>
            {isActionPending("deleteModel") ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
          </Button>
        </div>
      )
    }
  ];

  const variableColumns: BaseTableColumn<NckhVariable>[] = [
    { key: "code", header: "Mã", render: (item) => <span className="font-mono text-xs font-semibold">{item.code}</span> },
    { key: "name", header: "Tên biến", render: (item) => item.name },
    { key: "type", header: "Loại", render: (item) => <Badge tone="info">{displayVariableType(item.variableType)}</Badge> },
    { key: "scale", header: "Thang đo", render: (item) => `${displayScaleType(item.scaleType)}${item.scalePoint ? ` ${item.scalePoint}` : ""}` },
    { key: "order", header: "Thứ tự", render: (item) => item.sortOrder },
    { key: "actions", header: "", render: (item) => <Button className="min-h-8 px-2 py-1" variant="danger" type="button" disabled={hasPendingAction || !canEditCanvas} onClick={() => deleteVariable(item)}>{isActionPending("deleteVariable") ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}</Button> }
  ];

  const mappingColumns: BaseTableColumn<NckhMapping>[] = [
    { key: "code", header: "Mã quan sát", render: (item) => <span className="font-mono text-xs font-semibold">{item.observedCode}</span> },
    { key: "question", header: "Câu hỏi", render: (item) => item.questionText },
    { key: "type", header: "Loại", render: (item) => <Badge tone="info">{displayQuestionType(item.questionType)}</Badge> },
    { key: "order", header: "Thứ tự", render: (item) => item.sortOrder },
    { key: "actions", header: "", render: (item) => <Button className="min-h-8 px-2 py-1" variant="danger" type="button" disabled={hasPendingAction || !canEditCanvas} onClick={() => deleteMapping(item)}>{isActionPending("deleteMapping") ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}</Button> }
  ];

  const relationColumns: BaseTableColumn<NckhRelation>[] = [
    { key: "code", header: "Giả thuyết", render: (item) => <span className="font-mono text-xs font-semibold">{item.hypothesisCode}</span> },
    { key: "relation", header: "Quan hệ", render: (item) => `${item.fromVariableCode} -> ${item.toVariableCode}` },
    { key: "direction", header: "Hướng", render: (item) => <Badge tone={relationTone(item.direction)}>{displayRelationDirection(item.direction)}</Badge> },
    { key: "text", header: "Nội dung", render: (item) => item.hypothesisText },
    { key: "actions", header: "", render: (item) => <Button aria-label={`Xóa quan hệ ${item.hypothesisCode}`} className="min-h-8 px-2 py-1" variant="danger" type="button" disabled={hasPendingAction || !canEditCanvas} onClick={() => deleteRelation(item)}>{isActionPending("deleteRelation") ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}</Button> }
  ];

  const responseColumns: BaseTableColumn<NckhRawResponse>[] = [
    { key: "google", header: "Phản hồi Google", render: (item) => <span className="font-mono text-xs">{item.googleResponseId}</span> },
    { key: "respondent", header: "Người trả lời", render: (item) => item.respondentId || "-" },
    { key: "time", header: "Thời gian", render: (item) => formatDate(item.responseTimestamp ?? item.createdAt) }
  ];

  if (isLoading) {
    return <LoadingState label="Đang tải không gian làm việc NCKH..." />;
  }

  if (error || !form) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" type="button" onClick={() => router.push("/dashboard/nckh")}><ArrowLeft size={16} /><span className="ml-2">Quay lại</span></Button>
        <Alert className="border-red-200 bg-red-50 text-red-900">
          <p className="font-semibold">Không mở được không gian làm việc</p>
          <p className="mt-1">{error ?? "Không tìm thấy form."}</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="NCKH"
        title={form.title || "Form NCKH"}
        description={`Mã Google Form: ${form.googleFormId}`}
        actions={
          <>
            <Button variant="secondary" type="button" onClick={() => router.push("/dashboard/nckh")}><ArrowLeft size={16} /><span className="ml-2">Danh sách form</span></Button>
            <StatusBadge status={form.status ?? "Imported"} />
            <Badge tone="info">{form.questions.length} câu hỏi</Badge>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Layers3 size={18} /> Mô hình nghiên cứu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={createModel}>
            <Input placeholder="Tên mô hình" value={modelName} onChange={(event) => setModelName(event.target.value)} required />
            <Input placeholder="Mô tả ngắn" value={modelDescription} onChange={(event) => setModelDescription(event.target.value)} />
            <Button type="submit" disabled={isSavingModel || hasPendingAction}>{isSavingModel ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}<span className="ml-2">{isSavingModel ? "Đang tạo..." : "Tạo mô hình"}</span></Button>
          </form>
          <BaseTable columns={modelColumns} items={models} getRowKey={(item) => item.id} emptyTitle="Chưa có mô hình nghiên cứu" emptyDetail="Tạo mô hình đầu tiên để cấu hình biến, ánh xạ, sơ đồ quan hệ, dữ liệu và xuất dữ liệu." />
        </CardContent>
      </Card>

      {!selectedModel ? (
        <EmptyState title="Chưa chọn mô hình" detail="Tạo hoặc mở một mô hình để dùng không gian làm việc Phase 7." />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 rounded-lg border border-border/80 bg-white/70 p-2">
            {tabs.map((item) => (
              <button
                key={item.id}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${tab === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                type="button"
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {panelError && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900">
              <p className="font-semibold">Một phần dữ liệu chưa sẵn sàng</p>
              <p className="mt-1">{panelError}</p>
            </Alert>
          )}
          {isPanelLoading && <LoadingState label="Đang đồng bộ dữ liệu mô hình..." compact />}

          {tab === "overview" && <OverviewPanel form={form} model={selectedModel} questionColumns={questionColumns} />}
          {tab === "variables" && renderVariablesPanel()}
          {tab === "mapping" && renderMappingPanel()}
          {tab === "canvas" && renderCanvasPanel()}
          {tab === "generate" && renderGeneratePanel()}
          {tab === "data" && renderDataPanel()}
          {tab === "export" && renderExportPanel()}
          {canvasModal && renderCanvasModal()}
        </>
      )}
    </div>
  );

  function renderVariablesPanel() {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText size={18} /> Biến nghiên cứu</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={createVariable}>
            <Input disabled={!canEditCanvas} placeholder="Tên biến" value={variableDraft.name} onChange={(event) => setVariableDraft({ ...variableDraft, name: event.target.value })} required />
            <Input disabled={!canEditCanvas} placeholder="Mã biến" value={variableDraft.code} onChange={(event) => setVariableDraft({ ...variableDraft, code: event.target.value.toUpperCase() })} required />
            <DropdownSelect disabled={!canEditCanvas} value={variableDraft.variableType} options={variableTypeOptions} onChange={(value) => setVariableDraft({ ...variableDraft, variableType: value })} />
            <DropdownSelect
              disabled={!canEditCanvas}
              value={variableDraft.scaleType}
              options={scaleTypeOptions}
              onChange={(value) => setVariableDraft((draft) => ({
                ...draft,
                scaleType: value,
                scalePoint: value === "Likert" ? draft.scalePoint || "5" : "",
                minValue: value === "Scale" ? draft.minValue : "",
                maxValue: value === "Scale" ? draft.maxValue : ""
              }))}
            />
            <Input disabled={!canEditCanvas || variableDraft.scaleType !== "Likert"} placeholder="Điểm thang đo" type="number" min={2} max={10} step={1} value={variableDraft.scalePoint} onChange={(event) => setVariableDraft({ ...variableDraft, scalePoint: event.target.value })} />
            <Input disabled={!canEditCanvas || variableDraft.scaleType !== "Scale"} placeholder="Giá trị nhỏ nhất" type="number" value={variableDraft.minValue} onChange={(event) => setVariableDraft({ ...variableDraft, minValue: event.target.value })} />
            <Input disabled={!canEditCanvas || variableDraft.scaleType !== "Scale"} placeholder="Giá trị lớn nhất" type="number" value={variableDraft.maxValue} onChange={(event) => setVariableDraft({ ...variableDraft, maxValue: event.target.value })} />
            <div className="flex gap-2"><Input disabled={!canEditCanvas} placeholder="Thứ tự" type="number" value={variableDraft.sortOrder} onChange={(event) => setVariableDraft({ ...variableDraft, sortOrder: event.target.value })} /><Button type="submit" disabled={hasPendingAction || !canEditCanvas}>{isActionPending("createVariable") ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}<span className="ml-2">{isActionPending("createVariable") ? "Đang thêm..." : "Thêm"}</span></Button></div>
          </form>
          <BaseTable columns={variableColumns} items={variables} getRowKey={(item) => item.id} emptyTitle="Chưa có biến" emptyDetail="Thêm biến để tạo ánh xạ, sơ đồ quan hệ và bộ dữ liệu." />
        </CardContent>
      </Card>
    );
  }

  function renderMappingPanel() {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><GitBranch size={18} /> Ánh xạ câu hỏi - biến</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_120px_auto]" onSubmit={createMapping}>
            <SearchableDropdownSelect
              disabled={!canEditCanvas}
              value={mappingDraft.variableId}
              searchValue={mappingVariableSearch}
              options={filteredMappingVariableOptions}
              placeholder="Tìm biến"
              emptyText="Không có biến phù hợp"
              onSearchChange={setMappingVariableSearch}
              onChange={(value, option) => {
                setMappingDraft({ ...mappingDraft, variableId: value });
                setMappingVariableSearch(option.label);
              }}
            />
            <SearchableDropdownSelect
              disabled={!canEditCanvas}
              value={mappingDraft.formQuestionId}
              searchValue={mappingQuestionSearch}
              options={filteredMappingQuestionOptions}
              placeholder="Tìm câu hỏi"
              emptyText="Không có câu hỏi phù hợp"
              onSearchChange={setMappingQuestionSearch}
              onChange={(value, option) => {
                setMappingDraft({ ...mappingDraft, formQuestionId: value });
                setMappingQuestionSearch(option.label);
              }}
            />
            <Input disabled={!canEditCanvas} placeholder="Mã quan sát" value={mappingDraft.observedCode} onChange={(event) => setMappingDraft({ ...mappingDraft, observedCode: event.target.value.toUpperCase() })} required />
            <Input disabled={!canEditCanvas} placeholder="Thứ tự" type="number" value={mappingDraft.sortOrder} onChange={(event) => setMappingDraft({ ...mappingDraft, sortOrder: event.target.value })} />
            <Button type="submit" disabled={hasPendingAction || !canEditCanvas}>{isActionPending("createMapping") ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}<span className="ml-2">{isActionPending("createMapping") ? "Đang thêm..." : "Thêm"}</span></Button>
          </form>
          <BaseTable columns={mappingColumns} items={mappings} getRowKey={(item) => item.id} emptyTitle="Chưa có ánh xạ" emptyDetail="Ánh xạ dùng endpoint hiện có, không nhúng vào payload biến." />
        </CardContent>
      </Card>
    );
  }

  function renderCanvasPanel() {
    const flowNodes: Node[] = [
      ...variables.map((variable, index) => ({
        id: canvasNodeId(variableNodeType, variable.id),
        position: currentCanvasPosition(variableNodeType, variable.id, index),
        connectable: canEditCanvas,
        draggable: canEditCanvas,
        width: canvasNodeWidth,
        height: canvasNodeHeight,
        measured: { width: canvasNodeWidth, height: canvasNodeHeight },
        data: {
          label: (
            <div className="pointer-events-auto relative w-[184px] rounded-md border border-cyan-200 bg-white px-3 py-3 text-left shadow-sm">
              <Handle type="target" position={Position.Left} isConnectable={canEditCanvas} className="!h-3 !w-3 !border-cyan-700 !bg-white" />
              <Handle type="source" position={Position.Right} isConnectable={canEditCanvas} className="!h-3 !w-3 !border-cyan-700 !bg-cyan-600" />
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs font-bold text-primary">{variable.code}</span>
                <div className="flex items-center gap-1">
                  <Badge tone="info">{displayVariableType(variable.variableType)}</Badge>
                  <button
                    aria-label={`Xóa biến ${variable.code}`}
                    className="nodrag pointer-events-auto rounded border border-red-200 bg-red-50 p-1 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={hasPendingAction || !canEditCanvas}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteVariable(variable);
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5">{variable.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{displayScaleType(variable.scaleType)}{variable.scalePoint ? ` ${variable.scalePoint}` : ""}</p>
            </div>
          )
        },
        style: { width: canvasNodeWidth, height: canvasNodeHeight, background: "transparent", border: 0, padding: 0, boxShadow: "none" }
      })),
      ...relations.map((relation, index) => ({
        id: canvasNodeId(relationNodeType, relation.id),
        position: currentCanvasPosition(relationNodeType, relation.id, index),
        connectable: false,
        draggable: canEditCanvas,
        width: canvasRelationWidth,
        height: canvasRelationHeight,
        measured: { width: canvasRelationWidth, height: canvasRelationHeight },
        data: {
          label: (
            <div className="pointer-events-auto w-[176px] rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-left shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-amber-700">{relation.hypothesisCode}</span>
                <Badge tone={relationTone(relation.direction)}>{displayRelationDirection(relation.direction)}</Badge>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-700">{relation.fromVariableCode} -&gt; {relation.toVariableCode}</p>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {relationDirections.map((direction) => (
                  <button
                    aria-label={`${displayRelationDirection(direction)} ${relation.hypothesisCode}`}
                    className={`nodrag pointer-events-auto rounded border px-2 py-1 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${relation.direction === direction ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-slate-700 hover:bg-muted"}`}
                    disabled={hasPendingAction || !canEditCanvas || relation.direction === direction}
                    key={direction}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      updateRelationDirection(relation, direction);
                    }}
                  >
                    {direction === "Positive" ? "+" : "-"}
                  </button>
                ))}
              </div>
            </div>
          )
        },
        style: { width: canvasRelationWidth, height: canvasRelationHeight, background: "transparent", border: 0, padding: 0, boxShadow: "none" }
      }))
    ];
    const flowEdges: Edge[] = relations.flatMap((relation) => {
      const relationNodeId = canvasNodeId(relationNodeType, relation.id);
      const fromNodeId = canvasNodeId(variableNodeType, relation.fromVariableId);
      const toNodeId = canvasNodeId(variableNodeType, relation.toVariableId);
      const positive = relation.direction === "Positive";
      const edgeColor = positive ? "#059669" : "#d97706";
      return [
        {
          id: `${relation.id}:from`,
          source: fromNodeId,
          target: relationNodeId,
          type: "smoothstep",
          animated: canEditCanvas,
          style: { stroke: edgeColor, strokeWidth: 2, strokeDasharray: positive ? undefined : "6 5" },
          markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor }
        },
        {
          id: `${relation.id}:to`,
          source: relationNodeId,
          target: toNodeId,
          type: "smoothstep",
          animated: canEditCanvas,
          label: relation.hypothesisCode,
          style: { stroke: edgeColor, strokeWidth: 2, strokeDasharray: positive ? undefined : "6 5" },
          markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor }
        }
      ];
    });
    const positionCount = positions.length;

    return (
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2"><GitBranch size={18} /> Sơ đồ quan hệ mô hình</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={hasPendingAction} onClick={() => setCanvasModal("variables")}>
                <FileText size={16} />
                <span className="ml-2">Biến</span>
              </Button>
              <Button type="button" variant="secondary" disabled={hasPendingAction} onClick={() => setCanvasModal("mapping")}>
                <GitBranch size={16} />
                <span className="ml-2">Ánh xạ</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {!canEditCanvas && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900">
              <p className="font-semibold">Mô hình đang ở chế độ chỉ xem</p>
              <p className="mt-1">Chỉ có thể chỉnh sửa quan hệ và vị trí khi mô hình còn là bản nháp.</p>
            </Alert>
          )}
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-white/65 p-3">
                <div className="min-w-0 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{positionCount} vị trí đã lưu.</span>
                </div>
                <Button variant="secondary" type="button" disabled={hasPendingAction || variables.length === 0 || !canEditCanvas} onClick={saveDefaultPositions}>{isActionPending("savePositions") ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}<span className="ml-2">{isActionPending("savePositions") ? "Đang lưu..." : "Lưu bố cục"}</span></Button>
              </div>

              {variables.length === 0 ? (
                <EmptyState title="Chưa có biến để vẽ sơ đồ" detail="Thêm biến nghiên cứu trước khi tạo quan hệ và lưu vị trí nút." />
              ) : (
                <div className="h-[520px] overflow-hidden rounded-lg border border-border/80 bg-white/70">
                  <ReactFlow
                    colorMode="light"
                    defaultViewport={{ x: 16, y: 24, zoom: 1 }}
                    edges={flowEdges}
                    fitView
                    fitViewOptions={{ padding: 0.18 }}
                    maxZoom={1.5}
                    minZoom={0.45}
                    nodes={flowNodes}
                    nodesDraggable={canEditCanvas}
                    nodesConnectable={canEditCanvas}
                    onConnect={createRelationFromConnection}
                    onNodeDrag={(_, node) => {
                      if (!canEditCanvas) return;
                      setCanvasPositions((current) => ({
                        ...current,
                        [node.id]: { x: node.position.x, y: node.position.y }
                      }));
                    }}
                    onNodeDragStop={(_, node) => {
                      if (!canEditCanvas) return;
                      setCanvasPositions((current) => ({
                        ...current,
                        [node.id]: { x: node.position.x, y: node.position.y }
                      }));
                    }}
                    onNodesChange={onCanvasNodesChange}
                    panOnDrag={false}
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background color="#d8eef3" gap={36} />
                    <Controls showInteractive={false} />
                    <MiniMap nodeColor={(node) => node.id.startsWith(relationNodeType) ? "#f59e0b" : "#06b6d4"} pannable zoomable />
                  </ReactFlow>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-border/80 bg-white/65 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><CircleDot size={16} /> Trạng thái sơ đồ</div>
              <KeyValueRow label="Biến" value={variables.length} />
              <KeyValueRow label="Quan hệ" value={relations.length} />
              <KeyValueRow label="Vị trí đã lưu" value={positionCount} />
              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-muted-foreground">Quan hệ gần nhất</p>
                <div className="mt-2 space-y-2">
                  {relations.slice(0, 4).map((relation) => (
                    <div className="rounded-md border border-border/70 bg-white/70 p-2 text-xs" key={relation.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-semibold">{relation.hypothesisCode}</span>
                        <Badge tone={relationTone(relation.direction)}>{displayRelationDirection(relation.direction)}</Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">{relation.fromVariableCode} -&gt; {relation.toVariableCode}</p>
                      <p className="mt-1 leading-5">{relation.hypothesisText}</p>
                      <Button aria-label={`Xóa quan hệ ${relation.hypothesisCode}`} className="mt-2 min-h-8 px-2 py-1" variant="danger" type="button" disabled={hasPendingAction || !canEditCanvas} onClick={() => deleteRelation(relation)}>{isActionPending("deleteRelation") ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}<span className="ml-2">Xóa</span></Button>
                    </div>
                  ))}
                  {relations.length === 0 && <p className="text-sm text-muted-foreground">Chưa có quan hệ để hiển thị trong vùng thao tác.</p>}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Danh sách quan hệ</h3>
            <BaseTable columns={relationColumns} items={relations} getRowKey={(item) => item.id} emptyTitle="Chưa có quan hệ" emptyDetail="Thêm quan hệ để backend sinh giả thuyết theo quy tắc xác định." />
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderCanvasModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 md:items-center md:p-6" role="dialog" aria-modal="true" onClick={() => setCanvasModal(null)}>
        <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-xl border border-border bg-background shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Canvas tools</p>
              <p className="text-xs text-muted-foreground">Biến và ánh xạ mở trong pop-up từ sơ đồ.</p>
            </div>
            <Button variant="secondary" type="button" onClick={() => setCanvasModal(null)}>Đóng</Button>
          </div>
          <div className="max-h-[calc(92vh-60px)] overflow-auto p-4">
            {canvasModal === "variables" ? renderVariablesPanel() : renderMappingPanel()}
          </div>
        </div>
      </div>
    );
  }

  function renderGeneratePanel() {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><RefreshCw size={18} /> Tạo Google Form</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <p className="font-semibold">Cần quyền chỉnh sửa Google Form</p>
            <p className="mt-1">Nếu chưa cấp đủ quyền, thao tác tạo/cập nhật form sẽ bị chặn. Vui lòng liên kết lại Google.</p>
          </Alert>
          <Button type="button" disabled={hasPendingAction} onClick={generateForm}>
            {isActionPending("generateForm") ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            <span className="ml-2">
              {isActionPending("generateForm")
                ? selectedModel?.hasGeneratedForm ? "Đang cập nhật..." : "Đang tạo..."
                : selectedModel?.hasGeneratedForm ? "Cập nhật form từ mô hình" : "Tạo form từ mô hình"}
            </span>
          </Button>
          {lastGenerate && (
            <div className="rounded-lg border border-border/80 bg-white/60 p-4 text-sm">
              <p className="font-semibold">Kết quả gần nhất</p>
              <p className="mt-2">Tạo: {lastGenerate.questionsCreated}, cập nhật: {lastGenerate.questionsUpdated}, xóa: {lastGenerate.questionsDeleted}</p>
              <p>Nhập lại: {lastGenerate.reimported ? "Có" : "Không"}</p>
              {lastGenerate.formUrl && <a className="text-primary hover:underline" href={lastGenerate.formUrl} target="_blank" rel="noreferrer">Mở Google Form</a>}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderDataPanel() {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Database size={18} /> Dữ liệu khảo sát</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={hasPendingAction} onClick={collectResponses}>{isActionPending("collectResponses") ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}<span className="ml-2">{isActionPending("collectResponses") ? "Đang thu thập..." : "Thu thập phản hồi"}</span></Button>
            <Button type="button" variant="secondary" disabled={hasPendingAction} onClick={normalizeResponses}>{isActionPending("normalizeResponses") ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}<span className="ml-2">{isActionPending("normalizeResponses") ? "Đang chuẩn hóa..." : "Chuẩn hóa bộ dữ liệu"}</span></Button>
          </div>
          {lastCollect && (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
              <span className="font-semibold">Thu thập: </span>{lastCollect.responsesCollected} mới, {lastCollect.responsesSkipped} bỏ qua, trạng thái {displayCollectionStatus(lastCollect.status)}
            </Alert>
          )}
          {lastNormalize && (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
              <span className="font-semibold">Chuẩn hóa: </span>{lastNormalize.respondentsProcessed} người trả lời, {lastNormalize.variablesComputed} biến, {lastNormalize.missingDataCount} giá trị thiếu
            </Alert>
          )}
          {dataset?.hasStaleData && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900">
              <p className="font-semibold">Bộ dữ liệu đã cũ</p>
              <p className="mt-1">Bộ dữ liệu đã cũ sau thay đổi biến hoặc ánh xạ. Hãy chuẩn hóa lại trước khi xuất dữ liệu.</p>
            </Alert>
          )}
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Phản hồi thô</h3>
              <BaseTable columns={responseColumns} items={responses?.items ?? []} getRowKey={(item) => item.id} emptyTitle="Chưa có phản hồi thô" emptyDetail="Chạy thu thập phản hồi hoặc kiểm tra quyền đọc phản hồi Google." />
              {responses && responses.totalPages > 1 && <PaginationControls page={responses.page} totalPages={responses.totalPages} totalItems={responses.totalItems} onPrevious={() => null} onNext={() => null} />}
            </div>
            <DatasetPreview dataset={dataset} />
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderExportPanel() {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileDown size={18} /> Xuất bộ dữ liệu</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {dataset?.hasStaleData && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900">
              <p className="font-semibold">Không nên xuất bộ dữ liệu đã cũ</p>
              <p className="mt-1">Backend có thể trả 409 Conflict. Hãy chuẩn hóa lại trước khi tải file.</p>
            </Alert>
          )}
          <div className="grid gap-3 md:grid-cols-3">
            <Button className="h-auto flex-col items-start gap-1 py-3 text-left" variant="secondary" type="button" disabled={hasPendingAction} onClick={() => downloadExport("csv")}>
              <span className="flex items-center gap-2">{isActionPending("exportCsv") ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} {isActionPending("exportCsv") ? "Đang tải CSV..." : "Bộ dữ liệu CSV"}</span>
              <span className="text-xs font-normal text-muted-foreground">Dữ liệu đã chuẩn hóa</span>
            </Button>
            <Button className="h-auto flex-col items-start gap-1 py-3 text-left" variant="secondary" type="button" disabled={hasPendingAction} onClick={() => downloadExport("codebook")}>
              <span className="flex items-center gap-2">{isActionPending("exportCodebook") ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} {isActionPending("exportCodebook") ? "Đang tải codebook..." : "Codebook Excel"}</span>
              <span className="text-xs font-normal text-muted-foreground">Biến, ánh xạ và ghi chú</span>
            </Button>
            <Button className="h-auto flex-col items-start gap-1 py-3 text-left" variant="secondary" type="button" disabled={hasPendingAction} onClick={() => downloadExport("spss")}>
              <span className="flex items-center gap-2">{isActionPending("exportSpss") ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} {isActionPending("exportSpss") ? "Đang tải SPSS..." : "Cú pháp SPSS"}</span>
              <span className="text-xs font-normal text-muted-foreground">File lệnh nhập .sps</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
}

function LoadingState({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-2 text-sm text-muted-foreground ${compact ? "py-3" : "min-h-[60vh]"}`}>
      <Loader2 className="animate-spin" size={18} />
      {label}
    </div>
  );
}

function OverviewPanel({
  form,
  model,
  questionColumns
}: {
  form: NckhFormDetailResponse;
  model: NckhResearchModel;
  questionColumns: BaseTableColumn<NckhFormQuestion>[];
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardHeader><CardTitle>Mô hình đang mở</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <KeyValueRow label="Tên" value={model.name} />
          <KeyValueRow label="Trạng thái" value={<StatusBadge status={model.status} />} />
          <KeyValueRow label="Số biến" value={model.variableCount} />
          <KeyValueRow label="Mô tả" value={model.description || "-"} />
          <KeyValueRow label="Cập nhật" value={formatDate(model.updatedAt)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Câu hỏi đã nhập</CardTitle></CardHeader>
        <CardContent>
          <BaseTable columns={questionColumns} items={form.questions} getRowKey={(item) => item.id} emptyTitle="Chưa có câu hỏi" emptyDetail="Nhập lại form nếu cấu trúc câu hỏi chưa được lưu." />
        </CardContent>
      </Card>
    </div>
  );
}

function DatasetPreview({ dataset }: { dataset: NckhDatasetListResponse | null }) {
  if (!dataset || dataset.items.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Bộ dữ liệu</h3>
        <EmptyState title="Chưa có bộ dữ liệu" detail="Chạy chuẩn hóa sau khi đã có phản hồi thô và ánh xạ." />
      </div>
    );
  }

  const previewColumns = dataset.columns.slice(0, 6);
  const rows: DatasetPreviewRow[] = dataset.items.map((item, index) => ({
    ...item,
    previewKey: `${item.respondentId ?? "row"}-${index}`
  }));
  const columns: BaseTableColumn<DatasetPreviewRow>[] = [
    { key: "respondent", header: "Người trả lời", render: (item) => item.respondentId || "-" },
    ...previewColumns.map((column): BaseTableColumn<DatasetPreviewRow> => ({
      key: column,
      header: column,
      render: (item) => String(item.values[column] ?? "")
    })),
    { key: "stale", header: "Đã cũ", render: (item) => (item.isStale ? "Có" : "Không") }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Bộ dữ liệu</h3>
      <BaseTable columns={columns} items={rows} getRowKey={(item) => item.previewKey} emptyTitle="Chưa có bộ dữ liệu" emptyDetail="Chạy chuẩn hóa sau khi đã có phản hồi thô và ánh xạ." />
    </div>
  );
}
