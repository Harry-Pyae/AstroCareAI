import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** Accessible name (visually hidden). Pass an already-translated string. */
  label: string;
  /** Shown when `value` matches no option. */
  placeholder?: string;
  id?: string;
  className?: string;
}

const chevron = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const check = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 text-accent">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/** Themed replacement for native <select>: button trigger + listbox popover. */
export default function Select({ value, options, onChange, label, placeholder = '', id, className = '' }: SelectProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  function openList(index = Math.max(selectedIndex, 0)) {
    setActive(index);
    setOpen(true);
  }

  function close(returnFocus = true) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function choose(index: number) {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    close();
  }

  // Typeahead like native select: repeating one letter cycles matches,
  // a fast multi-letter string matches the whole prefix.
  function matchTyped(key: string, from: number) {
    const now = Date.now();
    typed.current = { text: now - typed.current.at > 500 ? key : typed.current.text + key, at: now };
    const query = typed.current.text.toLowerCase();
    const offset = query.length === 1 ? 1 : 0;
    for (let i = 0; i < options.length; i++) {
      const index = (from + offset + i) % options.length;
      if (options[index].label.toLowerCase().startsWith(query)) return index;
    }
    return -1;
  }

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${baseId}-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, baseId]);

  function onTriggerKeyDown(e: KeyboardEvent) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openList();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const index = matchTyped(e.key, Math.max(selectedIndex, 0));
      if (index >= 0) openList(index);
    }
  }

  function onListKeyDown(e: KeyboardEvent) {
    const last = options.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(active + 1, last),
      ArrowUp: Math.max(active - 1, 0),
      Home: 0,
      End: last,
    };
    if (e.key in moves) {
      e.preventDefault();
      setActive(moves[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      close(false);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const index = matchTyped(e.key, active);
      if (index >= 0) setActive(index);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <span id={`${baseId}-label`} className="sr-only">{label}</span>
      <button
        ref={triggerRef}
        id={`${baseId}-trigger`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${baseId}-list` : undefined}
        aria-labelledby={`${baseId}-label ${baseId}-trigger`}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onTriggerKeyDown}
        className="inline-flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-default bg-card px-3 text-left text-sm text-primary hover:border-strong"
      >
        <span className={`truncate ${selected ? '' : 'text-secondary'}`}>{selected?.label ?? placeholder}</span>
        <span className={`text-secondary transition-transform duration-[var(--dur-fast)] ${open ? 'rotate-180' : ''}`}>{chevron}</span>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={`${baseId}-list`}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${baseId}-label`}
          aria-activedescendant={optionId(active)}
          onKeyDown={onListKeyDown}
          className="motion-popover absolute left-0 z-50 mt-1 max-h-72 w-max min-w-full max-w-[calc(100vw-2rem)] overflow-auto rounded-lg border border-default bg-card p-1 shadow-lg"
        >
          {options.map((option, i) => (
            <li
              key={option.value}
              id={optionId(i)}
              role="option"
              aria-selected={option.value === value}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(i)}
              className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md px-3 text-sm ${
                i === active ? 'bg-card-raised text-primary' : 'text-secondary'
              } ${option.value === value ? 'font-semibold text-primary' : ''}`}
            >
              {option.label}
              {option.value === value && check}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
