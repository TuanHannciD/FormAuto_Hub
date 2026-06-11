import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import type { RelationFlowEdge } from "../_types";

export function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data
}: EdgeProps<RelationFlowEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });

  return (
    <>
      <BaseEdge markerEnd={markerEnd} path={edgePath} style={style} />
      <path
        className="react-flow__edge-interaction cursor-pointer"
        d={edgePath}
        fill="none"
        onClick={(event) => {
          event.stopPropagation();
          data?.onSelect(id);
        }}
        pointerEvents="stroke"
        stroke="transparent"
        strokeWidth={28}
      />
      <EdgeLabelRenderer>
        <button
          className={`nodrag nopan pointer-events-auto absolute rounded-full border px-2 py-1 text-[11px] font-semibold shadow-sm ${data?.selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-slate-700"}`}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            data?.onSelect(id);
          }}
        >
          {data?.label ?? id}
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
