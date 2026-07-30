"use client";

import { useEffect, useRef, useState } from "react";

export function ColumnFilterHeader({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isFiltered = selected.size > 0;

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function toggleValue(value: string) {
    const next = new Set(selected);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    onChange(next);
  }

  return (
    <th className="relative py-2 pr-4 font-medium">
      <div ref={ref} className="inline-block">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-1 ${isFiltered ? "text-[#3D3E40]" : ""}`}
        >
          {label}
          <svg
            viewBox="0 0 24 24"
            fill={isFiltered ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.8}
            className={`h-3 w-3 ${isFiltered ? "text-[#959D90]" : "text-[#B3AFA2]"}`}
          >
            <path d="M4 5h16l-6 8v5l-4 2v-7L4 5Z" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-[#E1DBCC] bg-white p-2 text-left normal-case shadow-lg">
            <div className="flex items-center justify-between border-b border-[#EFEAE0] pb-1.5 text-xs">
              <button
                type="button"
                onClick={() => onChange(new Set(options))}
                className="text-[#3D3E40] hover:underline"
              >
                Marcar todos
              </button>
              <button
                type="button"
                onClick={() => onChange(new Set())}
                className="text-[#7D7874] hover:underline"
              >
                Limpar
              </button>
            </div>
            <div className="mt-1.5 max-h-56 space-y-1 overflow-y-auto">
              {options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 rounded px-1 py-0.5 text-xs font-normal text-[#24252A] hover:bg-[#F7F5EF]"
                >
                  <input type="checkbox" checked={selected.has(option)} onChange={() => toggleValue(option)} />
                  <span className="truncate">{option}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </th>
  );
}
