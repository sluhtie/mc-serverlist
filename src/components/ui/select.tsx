"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useT } from "@/lib/i18n/client";

export type SelectOption = { value: string; label: string };

type SelectProps = {
  options: readonly SelectOption[];
  /** Form field name; the value is submitted through a hidden input. */
  name?: string;
  id?: string;
  defaultValue?: string;
  /** Controlled value. Use together with `onValueChange`. */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Shown when the current value matches no option. */
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  /** Smaller variant for dense tables. */
  size?: "sm" | "md";
};

/**
 * Styled replacement for the native <select>, following the WAI-ARIA "select-only combobox"
 * pattern: focus stays on the button, options are referenced via aria-activedescendant.
 */
export function Select({
  options,
  name,
  id,
  defaultValue = "",
  value: controlledValue,
  onValueChange,
  placeholder,
  className = "",
  "aria-label": ariaLabel,
  size = "md",
}: SelectProps) {
  const t = useT();
  const autoId = useId();
  const buttonId = id ?? `${autoId}-button`;
  const listId = `${autoId}-list`;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  // Follow a changed defaultValue, e.g. after navigating to "/" via "Zurücksetzen".
  const [prevDefault, setPrevDefault] = useState(defaultValue);
  if (prevDefault !== defaultValue) {
    setPrevDefault(defaultValue);
    setUncontrolledValue(defaultValue);
  }
  const value = controlledValue ?? uncontrolledValue;
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: "", timer: 0 });

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  function commit(index: number) {
    const option = options[index];
    if (!option) return;
    if (controlledValue === undefined) setUncontrolledValue(option.value);
    if (option.value !== value) onValueChange?.(option.value);
  }

  function openList(index = selectedIndex >= 0 ? selectedIndex : 0) {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setDropUp(below < 280 && rect.top > below);
    }
    setActive(Math.max(0, Math.min(options.length - 1, index)));
    setOpen(true);
  }

  // Close when clicking anywhere outside the component.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the highlighted option visible while navigating with the keyboard.
  useEffect(() => {
    if (!open) return;
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function findByPrefix(char: string) {
    const t = typeahead.current;
    window.clearTimeout(t.timer);
    t.text += char.toLowerCase();
    t.timer = window.setTimeout(() => (t.text = ""), 600);
    const start = open ? active : Math.max(selectedIndex, 0);
    // A repeated single letter cycles through matches, like the native select.
    const offset = t.text.length === 1 ? 1 : 0;
    for (let i = 0; i < options.length; i++) {
      const index = (start + offset + i) % options.length;
      if (options[index].label.toLowerCase().startsWith(t.text)) return index;
    }
    return -1;
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const last = options.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        openList(e.key === "Home" ? 0 : last);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const index = findByPrefix(e.key);
        if (index >= 0) commit(index);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (e.altKey) {
          commit(active);
          setOpen(false);
        } else setActive((i) => Math.max(0, i - 1));
        break;
      case "Home":
      case "PageUp":
        e.preventDefault();
        setActive((i) => (e.key === "Home" ? 0 : Math.max(0, i - 10)));
        break;
      case "End":
      case "PageDown":
        e.preventDefault();
        setActive((i) => (e.key === "End" ? last : Math.min(last, i + 10)));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(active);
        setOpen(false);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        commit(active);
        setOpen(false);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          const index = findByPrefix(e.key);
          if (index >= 0) setActive(index);
        }
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name !== undefined && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        id={buttonId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
        className={`input flex items-center justify-between gap-2 text-left ${
          size === "sm" ? "py-1" : ""
        } ${open ? "border-brand-500 ring-4 ring-brand-500/15" : ""}`}
      >
        <span className={`truncate ${selected ? "" : "text-subtle"}`}>
          {selected?.label ?? placeholder ?? t.common.selectPlaceholder}
        </span>
        <svg
          viewBox="0 0 20 20"
          aria-hidden
          className={`h-4 w-4 shrink-0 text-subtle transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-labelledby={ariaLabel ? undefined : buttonId}
        aria-label={ariaLabel}
        tabIndex={-1}
        hidden={!open}
        // Keep focus on the button so its blur handler does not close the list mid-click.
        onMouseDown={(e) => e.preventDefault()}
        className={`absolute inset-x-0 z-30 max-h-72 min-w-max overflow-auto rounded-xl border border-line-strong bg-surface p-1 shadow-xl shadow-black/20 ${
          dropUp ? "bottom-full mb-1" : "top-full mt-1"
        }`}
      >
        {options.map((option, i) => {
          const isSelected = option.value === value;
          return (
            <li
              key={option.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={isSelected}
              onMouseEnter={() => setActive(i)}
              onClick={() => {
                commit(i);
                setOpen(false);
              }}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-sm ${
                i === active ? "bg-surface-2 text-fg" : "text-fg-soft"
              }`}
            >
              <span className="truncate">{option.label}</span>
              {isSelected && (
                <svg viewBox="0 0 20 20" aria-hidden className="h-4 w-4 shrink-0 text-accent">
                  <path d="m4.5 10.5 3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
