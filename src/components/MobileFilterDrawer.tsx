"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import cigaretteIcon from "@/assets/images/cigarete-icon.svg";

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 5L19 19M19 5L5 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[#414141]">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M7 8.5L10 11.5L13 8.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

const SELECT_CLASS =
  "h-12 w-full appearance-none rounded-[0.5rem] border-2 border-transparent bg-white px-4 pr-10 text-[0.9375rem] leading-none font-semibold text-[#414141] shadow-[0_4px_22.5px_rgba(0,0,0,0.1)] outline-none";

type MobileFilterDrawerProps = {
  open: boolean;
  onClose: () => void;
  collections: string[];
  colors: string[];
  sortOptions: string[];
  collection: string | null;
  color: string | null;
  sortBy: string | null;
  size: string | null;
  onCollectionChange: (v: string | null) => void;
  onColorChange: (v: string | null) => void;
  onSortByChange: (v: string | null) => void;
  onOpenSizeModal: () => void;
  onClearAll: () => void;
};

export default function MobileFilterDrawer({
  open,
  onClose,
  collections,
  colors,
  sortOptions,
  collection,
  color,
  sortBy,
  size,
  onCollectionChange,
  onColorChange,
  onSortByChange,
  onOpenSizeModal,
  onClearAll,
}: MobileFilterDrawerProps) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);
      const timeout = setTimeout(() => {
        setMounted(false);
        setClosing(false);
      }, 320);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[110] lg:hidden">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={`absolute inset-0 z-0 bg-black/60 ${
          closing ? "animate-size-modal-backdrop-out" : "animate-size-modal-backdrop-in"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={`absolute inset-y-0 right-0 z-10 flex h-full w-full max-w-[24rem] flex-col overflow-hidden bg-[#f5f4f1] shadow-[-8px_0_32px_rgba(0,0,0,0.12)] ${
          closing ? "animate-size-modal-panel-out" : "animate-size-modal-panel-in"
        }`}
      >
        <div className="flex-1 overflow-y-auto px-6 pt-8 pb-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-extrabold text-[#414141]">Filters</h2>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onClearAll}
                className="h-8 rounded-[0.5rem] border-2 border-[#dcc090] px-3 text-[0.625rem] leading-none font-black tracking-[0.01em] text-[#dcc090] uppercase transition-colors hover:bg-[#dcc090]/10"
              >
                Clear All
              </button>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="text-[#414141] transition-opacity hover:opacity-70"
              >
                <CloseIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-[6.5rem] w-[6rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-[#dcc090] bg-white">
              <Image src={cigaretteIcon} alt="" className="h-9 w-auto" />
              <span className="text-center text-[10px] leading-tight font-medium text-[#414141]">
                Cigarette
                <br />
                Packs
              </span>
            </div>
            <div className="flex h-[6.5rem] w-[6rem] flex-col items-center justify-center gap-2 rounded-xl bg-white/50 opacity-50">
              <span className="text-center text-[10px] leading-tight font-medium text-[#414141]">
                Money
              </span>
            </div>
            <div className="flex h-[6.5rem] w-[6rem] flex-col items-center justify-center gap-2 rounded-xl bg-white/50 opacity-50">
              <span className="text-center text-[10px] leading-tight font-medium text-[#414141]">
                Phone Cases
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <label className="relative block">
              <select
                className={SELECT_CLASS}
                value={collection ?? "all"}
                onChange={(e) =>
                  onCollectionChange(e.target.value === "all" ? null : e.target.value)
                }
              >
                <option value="all">Collections</option>
                {collections.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronIcon />
            </label>

            <label className="relative block">
              <select
                className={SELECT_CLASS}
                value={color ?? "all"}
                onChange={(e) =>
                  onColorChange(e.target.value === "all" ? null : e.target.value)
                }
              >
                <option value="all">Color</option>
                {colors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronIcon />
            </label>

            <label className="relative block">
              <select
                className={`${SELECT_CLASS} font-extrabold`}
                value={sortBy ?? "default"}
                onChange={(e) =>
                  onSortByChange(e.target.value === "default" ? null : e.target.value)
                }
              >
                <option value="default">Sort By</option>
                {sortOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronIcon />
            </label>

            <button
              type="button"
              onClick={onOpenSizeModal}
              className="h-12 w-full rounded-[0.5rem] border-2 border-transparent bg-[#dcc090] px-4 text-left text-[0.9375rem] leading-none font-semibold text-[#122a26]"
            >
              {size ?? "Select cigarette"}
            </button>
          </div>
        </div>

        <div className="shrink-0 border-t border-black/5 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-full items-center justify-center rounded-[0.5rem] border-2 border-[#dcc090] text-sm font-black tracking-[0.14em] text-[#dcc090] uppercase transition-colors hover:bg-[#dcc090]/10"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
