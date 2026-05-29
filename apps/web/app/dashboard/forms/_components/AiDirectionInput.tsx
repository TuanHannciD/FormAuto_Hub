import { Input } from "@/components/ui";
import { AI_SHORT_FIELD_MAX_LENGTH } from "../_constants";

export function AiDirectionInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <Input
        className="mt-2"
        maxLength={AI_SHORT_FIELD_MAX_LENGTH}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
