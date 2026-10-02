"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import cigaretteIcon from "@/assets/images/cigarete-icon.svg";
import { CIGARETTE_SIZES } from "@/data/cigaretteSizes";
import { useSwipeSheet } from "@/hooks/useSwipeSheet";

function ChevronIcon({
  direction,
  className,
}: {
  direction: "left" | "right";
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d={direction === "left" ? "M15 18L9 12L15 6" : "M9 18L15 12L9 6"}
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type SelectedItem = { category: string; name: string; index: number };

function CategoryRow({
  name,
  items,
  selected,
  onSelect,
}: {
  name: string;
  items: string[];
  selected: SelectedItem | null;
  onSelect: (item: SelectedItem) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [containerWidth, setContainerWidth] = useState(580);

  const CARD_WIDTH = 82;
  const GAP = 8;
  const MAX_COLS = 7;
  const cols = Math.min(
    MAX_COLS,
    Math.max(1, Math.floor((containerWidth + GAP) / (CARD_WIDTH + GAP))),
  );
  const pageSize = cols * 2;
  const pages: string[][] = [];
  for (let i = 0; i < items.length; i += pageSize) {
    pages.push(items.slice(i, i + pageSize));
  }

  const updateScrollState = () => {
    const row = rowRef.current;
    if (!row) return;
    setCanScrollLeft(row.scrollLeft > 4);
    setCanScrollRight(row.scrollLeft + row.clientWidth < row.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  const scrollByPage = (direction: 1 | -1) => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({ left: direction * row.clientWidth, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <section aria-label={name}>
      <div className="flex min-h-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          disabled={!canScrollLeft}
          onClick={() => scrollByPage(-1)}
          aria-label="Scroll sizes left"
          className={`flex shrink-0 items-center justify-center bg-transparent p-1 text-[#414141] transition-opacity ${
            canScrollLeft ? "cursor-pointer hover:opacity-70" : "cursor-not-allowed opacity-30"
          }`}
        >
          <ChevronIcon direction="left" className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
        </button>

        <h3 className="min-w-0 flex-1 truncate text-lg font-extrabold text-[#414141] sm:text-xl">
          {name}
        </h3>

        <button
          type="button"
          disabled={!canScrollRight}
          onClick={() => scrollByPage(1)}
          aria-label="Scroll sizes right"
          className={`flex shrink-0 items-center justify-center bg-transparent p-1 text-[#414141] transition-opacity ${
            canScrollRight ? "cursor-pointer hover:opacity-70" : "cursor-not-allowed opacity-30"
          }`}
        >
          <ChevronIcon direction="right" className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
        </button>
      </div>

      <div
        ref={rowRef}
        onScroll={updateScrollState}
        className="scrollbar-hide mt-6 flex overflow-x-auto scroll-smooth pb-1"
      >
        {pages.map((page, pageIndex) => (
          <div
            key={pageIndex}
            className="grid shrink-0 grid-rows-2 gap-x-2 gap-y-5 sm:gap-x-4 sm:gap-y-6"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(82px, 1fr))`,
              width: containerWidth,
            }}
          >
            {page.map((itemName, i) => {
              const index = pageIndex * pageSize + i;
              const isSelected =
                selected?.category === name &&
                selected?.name === itemName &&
                selected?.index === index;
              return (
                <button
                  key={`${itemName}-${index}`}
                  type="button"
                  onClick={() => onSelect({ category: name, name: itemName, index })}
                  className={`mx-auto flex h-[92px] w-[82px] flex-col items-center rounded-[10px] border bg-white pt-1 shadow-[0px_2px_8px_rgba(0,0,0,0.06)] transition-shadow sm:h-[96px] sm:w-[88px] ${
                    isSelected
                      ? "border-[#dcc090] ring-2 ring-[#dcc090]/40"
                      : "border-transparent"
                  }`}
                >
                  <span className="relative h-[50px] w-[36px] shrink-0 overflow-hidden sm:h-[52px] sm:w-[38px]">
                    <Image
                      src={cigaretteIcon}
                      alt=""
                      fill
                      className="object-contain"
                    />
                  </span>
                  <span className="mt-1 line-clamp-2 w-full px-0.5 text-center text-[11px] leading-tight font-medium text-[#414141] sm:text-[12px]">
                    {itemName}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

type SizeSelectorModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: (item: SelectedItem) => void;
};

export default function SizeSelectorModal({
  open,
  onClose,
  onApply,
}: SizeSelectorModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const {
    mounted,
    sheetRef,
    contentRef,
    sheetStyle,
    backdropClassName,
    handleProps,
    contentDragProps,
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

  const query = search.trim().toLowerCase();
  const filteredCategories = CIGARETTE_SIZES.map((category) => ({
    name: category.name,
    items: query
      ? category.items.filter((item) => item.toLowerCase().includes(query))
      : category.items,
  })).filter((category) => category.items.length > 0);

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center text-left sm:items-center sm:p-4 sm:pt-20">
      <button
        type="button"
        aria-label="Close"
        onClick={requestClose}
        className={`absolute inset-0 z-0 bg-black/60 ${backdropClassName}`}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-selector-title"
        style={sheetStyle}
        className="relative z-10 flex h-[80vh] w-full max-w-[40rem] flex-col overflow-hidden rounded-t-[1.75rem] bg-[#efefef] shadow-[0_-20px_60px_rgba(0,0,0,0.25)] sm:h-[65vh] sm:rounded-[1.75rem] sm:shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
      >
        <div
          {...handleProps}
          className="flex shrink-0 touch-none justify-center py-3"
        >
          <div className="h-1 w-10 rounded-full bg-black/20" />
        </div>
        <div {...contentDragProps} className="flex min-h-0 flex-1 flex-col">
        <div
          ref={contentRef}
          className="relative min-h-0 flex-1 touch-none overflow-y-auto px-6 pb-8 sm:px-12 sm:pt-6"
        >
          <h2
            id="size-selector-title"
            className="text-[28px] font-extrabold leading-none text-[#414141] sm:text-[36px]"
          >
            Select size
          </h2>

          <div className="sticky top-0 z-10 mt-6 w-full max-w-[978px] bg-[#efefef] pt-1 pb-3">
            <label htmlFor="size-search" className="sr-only">
              Search by cigarette name
            </label>
            <input
              id="size-search"
              type="search"
              placeholder="Search by cigarette name"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-md border-0 bg-white px-4 text-[15px] font-medium text-[#414141] shadow-[0px_4px_22.5px_rgba(0,0,0,0.1)] outline-none placeholder:text-[#9d9d9d] focus-visible:ring-2 focus-visible:ring-[#dcc090]/40 sm:text-[16px]"
            />
          </div>

          <div className="mt-10 space-y-[50px] pb-8">
            {filteredCategories.map((category) => (
              <CategoryRow
                key={category.name}
                name={category.name}
                items={category.items}
                selected={selected}
                onSelect={setSelected}
              />
            ))}
            {filteredCategories.length === 0 && (
              <p className="text-sm text-[#9d9d9d]">
                No cigarettes match “{search}”.
              </p>
            )}
          </div>
        </div>

        {selected && (
          <div className="flex shrink-0 items-center justify-between gap-4 border-t border-black/5 bg-[#efefef] px-6 pb-10 pt-4 sm:px-12">
            <p className="min-w-0 truncate text-sm font-medium text-[#414141]">
              <span className="text-[#9d9d9d]">{selected.category}:</span>{" "}
              <br /><span>{selected.name}</span>
            </p>
            <button
              type="button"
              onClick={() => onApply(selected)}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-[#dcc090] px-7 text-sm font-extrabold tracking-[0.2em] text-[#122a26] uppercase transition-colors hover:bg-[#d3b57c]"
            >
              Apply
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
