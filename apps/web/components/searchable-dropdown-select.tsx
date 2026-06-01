"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { DropdownOption } from "@/components/dropdown-select";
import { cn } from "@/lib/utils";

export type SearchableDropdownOption = DropdownOption & {
  description?: string;
};

type SearchableDropdownSelectProps = {
  value: string;
  searchValue: string;
  options: SearchableDropdownOption[];
  onSearchChange: (value: string) => void;
  onChange: (value: string, option: SearchableDropdownOption) => void;
  className?: string;
  placeholder?: string;
  emptyText?: string;
  loadingText?: string;
  loading?: boolean;
  disabled?: boolean;
};

export function SearchableDropdownSelect({
  value,
  searchValue,
  options,
  onSearchChange,
  onChange,
  className,
  placeholder = "Tìm kiếm",
  emptyText = "Không có kết quả phù hợp",
  loadingText = "Đang tìm kiếm...",
  loading = false,
  disabled = false
}: SearchableDropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);

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
      <div
        className={cn(
          "flex min-h-10 w-full items-center gap-2 rounded-md border border-border/80 bg-white/85 px-3 py-2 text-sm outline-none transition",
          "focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/15 hover:border-primary/70",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          aria-autocomplete="list"
          aria-controls={id}
          aria-expanded={open}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          disabled={disabled}
          onChange={(event) => {
            onSearchChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          role="combobox"
          type="search"
          value={searchValue}
        />
        <button
          aria-label="Mở danh sách kết quả"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition hover:text-primary disabled:cursor-not-allowed"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
        </button>
      </div>

      {open && !disabled && (
        <div
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border/80 bg-white/95 p-1 text-sm shadow-lg backdrop-blur"
          id={id}
          role="listbox"
        >
          {loading && <div className="px-3 py-2 text-muted-foreground">{loadingText}</div>}
          {!loading && options.length === 0 && <div className="px-3 py-2 text-muted-foreground">{emptyText}</div>}
          {!loading && options.map((option) => {
            const active = option.value === value;
            return (
              <button
                aria-selected={active}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-sm px-3 py-2 text-left transition",
                  active ? "bg-cyan-50 font-medium text-cyan-900" : "text-foreground hover:bg-muted",
                  option.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
                )}
                disabled={option.disabled}
                key={option.value}
                onClick={() => {
                  onChange(option.value, option);
                  setOpen(false);
                }}
                role="option"
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate">{option.label}</span>
                  {option.description && <span className="block truncate text-xs font-normal text-muted-foreground">{option.description}</span>}
                </span>
                {active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
