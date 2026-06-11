import type { Edge } from "@xyflow/react";
import type { NckhDatasetListResponse } from "@/lib/api";

export type WorkspaceTab = "overview" | "variables" | "mapping" | "canvas" | "generate" | "data" | "export";

export type PendingAction =
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

export type DatasetPreviewRow = NckhDatasetListResponse["items"][number] & {
  previewKey: string;
};

export type CanvasPosition = { x: number; y: number };
export type CanvasModal = "variables" | "mapping" | null;
export type CanvasNodeSize = { width: number; height: number };
export type RelationEdgeData = {
  [key: string]: unknown;
  label: string;
  selected: boolean;
  onSelect: (relationId: string) => void;
};
export type RelationFlowEdge = Edge<RelationEdgeData, "relation">;
