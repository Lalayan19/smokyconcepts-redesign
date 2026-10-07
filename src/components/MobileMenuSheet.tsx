"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useSwipeSheet } from "@/hooks/useSwipeSheet";

export type MenuLink = { href: string; label: string };
export type MenuCurrency = { code: string; symbol: string };
export type MenuLanguage = { code: string; label: string };

type MobileMenuSheetProps = {
  open: boolean;
  onClose: () => void;
  links: MenuLink[];
  pathname: string;
  currencies: MenuCurrency[];
  currency: MenuCurrency;
  onCurrencyChange: (currency: MenuCurrency) => void;
  languages: MenuLanguage[];
  language: MenuLanguage;
  onLanguageChange: (language: MenuLanguage) => void;
};

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M4 11.5L12 4.5l8 7M6 10v9h12v-9M10 19v-5h4v5" />
    </svg>
  );
}

function ShopIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M6 8h12l-1 11a2 2 0 0 1-2 1.8H9A2 2 0 0 1 7 19L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function AboutIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.2M12 7.8v.1" />
    </svg>
  );
}

function PersonalizationIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <path d="M4 20l4.243-.707 10.607-10.607a1.5 1.5 0 0 0 0-2.121l-1.415-1.415a1.5 1.5 0 0 0-2.121 0L4.707 15.757 4 20Z" />
      <path d="M14.5 6.5l3 3" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON_PROPS} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.3 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.3-3.5-8.5S9.6 5.9 12 3.5Z" />
    </svg>
  );
}

const ROUTE_ICONS: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  "/": HomeIcon,
  "/shop": ShopIcon,
  "/about": AboutIcon,
  "/personalization": PersonalizationIcon,
};

// The order and wording the design shows: English, Russian, Armenian; AMD, USD, RUB.
const LANGUAGE_ORDER = ["EN", "RU", "HY"];
const CURRENCY_ORDER = ["AMD", "USD", "RUB"];

function inOrder<T extends { code: string }>(items: T[], order: string[]) {
  return order
    .map((code) => items.find((item) => item.code === code))
    .filter((item): item is T => item !== undefined);
}

const SECTION_LABEL = "text-[11px] font-bold tracking-[0.14em] text-brand-muted uppercase";

function Segmented<T extends { code: string }>({
  label,
  items,
  selected,
  onSelect,
  render,
}: {
  label: string;
  items: T[];
  selected: T;
  onSelect: (item: T) => void;
  render: (item: T) => React.ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex rounded-2xl bg-white/[0.06] p-1"
    >
      {items.map((item) => {
        const active = item.code === selected.code;
        return (
          <button
            key={item.code}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(item)}
            style={{ height: 36 }}
            className={`flex flex-1 items-center justify-center rounded-xl text-[13px] font-bold transition-colors ${
              active
                ? "bg-brand-gold text-brand-dark shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
                : "text-brand-muted hover:text-brand-gold"
            }`}
          >
            {render(item)}
          </button>
        );
      })}
    </div>
  );
}

// The menu of the phone's header, as a sheet in the same style and size as the
// size and customize sheets: it comes up from the bottom, the handle or a
// swipe down closes it, and so does a tap on the dark area behind it.
export default function MobileMenuSheet({
  open,
  onClose,
  links,
  pathname,
  currencies,
  currency,
  onCurrencyChange,
  languages,
  language,
  onLanguageChange,
}: MobileMenuSheetProps) {
  const {
    mounted,
    sheetRef,
    contentRef,
    sheetStyle,
    modalAnimation,
    backdropClassName,
    handleProps,
    requestClose,
  } = useSwipeSheet({ open, onClose });

  useEffect(() => {
    if (!mounted) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="mobile-menu-sheet fixed inset-0 z-[110] flex items-end justify-center text-left sm:items-center sm:p-4 sm:pt-20 md:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={requestClose}
        className={`absolute inset-0 z-0 bg-black/60 ${backdropClassName}`}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-sheet-title"
        style={sheetStyle}
        className={`relative z-10 sheet-height flex w-full max-w-[40rem] flex-col overflow-hidden rounded-t-[1.75rem] bg-brand-dark shadow-[0_-20px_60px_rgba(0,0,0,0.45)] sm:rounded-[1.75rem] sm:shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${modalAnimation}`}
      >
        <div {...handleProps} className="sheet-handle flex shrink-0 touch-none justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-brand-gold/30" />
        </div>

        <div
          ref={contentRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-4 pb-10 sm:px-12"
        >
          <h2
            id="menu-sheet-title"
            className="text-[28px] leading-none font-extrabold text-brand-gold"
          >
            Menu
          </h2>

          <nav aria-label="Main" className="mt-5">
            {links.map(({ href, label }, index) => {
              const active = pathname === href;
              const Icon = ROUTE_ICONS[href];
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={requestClose}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-4 py-4 text-[17px] transition-colors ${
                    index !== links.length - 1 ? "border-b border-brand-muted/20" : ""
                  } ${
                    active
                      ? "font-extrabold text-brand-gold"
                      : "font-semibold text-brand-gold/80 hover:text-brand-gold"
                  }`}
                >
                  {Icon && <Icon className="h-6 w-6 shrink-0" />}
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 text-brand-muted" style={{ marginTop: 20 }}>
            <GlobeIcon className="h-4 w-4" />
            <p className={SECTION_LABEL}>Language</p>
          </div>
          <div className="mt-3">
            <Segmented
              label="Language"
              items={inOrder(languages, LANGUAGE_ORDER)}
              selected={language}
              onSelect={onLanguageChange}
              render={(l) => l.label}
            />
          </div>

          <p className={`${SECTION_LABEL} mt-7`}>Currency</p>
          <div className="mt-3">
            <Segmented
              label="Currency"
              items={inOrder(currencies, CURRENCY_ORDER)}
              selected={currency}
              onSelect={onCurrencyChange}
              render={(c) => `${c.symbol} ${c.code}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
