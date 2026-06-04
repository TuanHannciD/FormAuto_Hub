import { Input } from "@/components/ui";
import { CHECKBOX_SELECTION_MIN, MAX_RULE_VALUES } from "../_constants";
import { clampInteger } from "../_helpers";

export function CheckboxSelectionFields({
  value,
  maxOptionCount,
  onChange
}: {
  value: { minSelections: number; maxSelections: number };
  maxOptionCount: number;
  onChange: (value: { minSelections?: number; maxSelections?: number }) => void;
}) {
  const maxAllowed = Math.min(maxOptionCount, MAX_RULE_VALUES);

  return (
    <div className="mt-3 grid gap-3 border-t border-border/70 pt-3 sm:grid-cols-2">
      <label className="block text-sm font-medium">
        Số lựa chọn tối thiểu
        <Input
          className="mt-2"
          inputMode="numeric"
          max={maxAllowed}
          min={CHECKBOX_SELECTION_MIN}
          step={1}
          type="number"
          value={value.minSelections}
          onChange={(event) => onChange({ minSelections: clampInteger(event.target.value, CHECKBOX_SELECTION_MIN, maxAllowed) })}
        />
      </label>
      <label className="block text-sm font-medium">
        Số lựa chọn tối đa
        <Input
          className="mt-2"
          inputMode="numeric"
          max={maxAllowed}
          min={value.minSelections}
          step={1}
          type="number"
          value={value.maxSelections}
          onChange={(event) => onChange({ maxSelections: clampInteger(event.target.value, value.minSelections, maxAllowed) })}
        />
      </label>
    </div>
  );
}
