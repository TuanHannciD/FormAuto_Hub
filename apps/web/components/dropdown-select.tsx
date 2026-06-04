"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type DropdownOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type DropdownSelectProps = {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function DropdownSelect({
  value,
  options,
  onChange,
  className,
  placeholder = "Chọn một mục",
  disabled = false
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      <button
        aria-controls={id}
        aria-expanded={open}
        className={cn(
          "flex min-h-10 w-full items-center justify-between gap-3 rounded-md border border-border/80 bg-white/85 px-3 py-2 text-left text-sm outline-none transition",
          "hover:border-primary/70 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15",
          disabled && "cursor-not-allowed opacity-50"
        )}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border/80 bg-white/95 p-1 text-sm shadow-lg backdrop-blur"
          id={id}
          role="listbox"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                aria-selected={active}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left transition",
                  active ? "bg-cyan-50 font-medium text-cyan-900" : "text-foreground hover:bg-muted",
                  option.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
                )}
                disabled={option.disabled}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                role="option"
                type="button"
              >
                <span className="truncate">{option.label}</span>
                {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
