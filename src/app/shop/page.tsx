"use client";

import { Suspense, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { COLLECTION_KEYS } from "@/data/collectionKeys";
import ShopProductCard from "@/components/ShopProductCard";
import BrandSelectorModal from "@/components/BrandSelectorModal";
import { PRODUCT_CATEGORIES } from "@/data/products";
import atelierCoin from "@/assets/images/covered_collections_section/atelier.png";
import classicCoin from "@/assets/images/covered_collections_section/classic.png";
import premiumCoin from "@/assets/images/covered_collections_section/premium.png";
import specialCoin from "@/assets/images/covered_collections_section/special.png";

const COLLECTIONS = PRODUCT_CATEGORIES.map((c) => c.name);

// The coin of each collection (the ones in the home page's Collections row), shown
// at the left of its heading on a tablet and larger; a phone does not show it.
const COLLECTION_COINS: Record<string, StaticImageData> = {
  Classic: classicCoin,
  Premium: premiumCoin,
  Atelier: atelierCoin,
  "Special Edition": specialCoin,
};

// The collection buttons are always one row across the full width, inside a bar
// with a thin gold edge and a blurred background. The bar is part of the page: it
// scrolls away with it (it used to stick just under the header).
//
// Its text is as large as it can be (up to FIT_MAX_PX) while all four names still
// fit; the buttons are sized in `em`, so they shrink with it. This is measured
// with the real font, so it holds on every phone, whatever its system font: a
// name is never cut short.
const FIT_MAX_PX = 12;
const FIT_MIN_GAP_PX = 8; // least space between two buttons

function CollectionBar({
  selected,
  onToggle,
  label,
}: {
  selected: string[];
  onToggle: (name: string) => void;
  // The name of a collection in the chosen language.
  label: (name: string) => string;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  // The size of the text is fitted again when the names change (another language).
  const names = COLLECTIONS.map(label).join("|");

  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const fit = () => {
      // The widths of the buttons when the text is at its largest...
      bar.style.fontSize = `${FIT_MAX_PX}px`;
      const buttons = Array.from(bar.children);
      const natural = buttons.reduce((sum, b) => sum + b.getBoundingClientRect().width, 0);
      const style = getComputedStyle(bar);
      const inside = bar.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const room = inside - (buttons.length - 1) * FIT_MIN_GAP_PX;
      // ...and the size at which they (everything is in em) just fit the room.
      const size = Math.min(FIT_MAX_PX, (FIT_MAX_PX * room * 0.99) / natural);
      bar.style.fontSize = `${Math.max(5, Math.floor(size * 10) / 10)}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(bar);
    // The sizes of the letters change once the page's fonts have loaded.
    document.fonts?.ready.then(fit);
    document.fonts?.addEventListener("loadingdone", fit);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener("loadingdone", fit);
    };
  }, [names]);

  return (
    <div
      // Only the bar itself takes clicks, not the empty space around it.
      className="shop-collection-bar pointer-events-none mt-4 flex h-[60px] items-center"
    >
      <div
        ref={barRef}
        className="pointer-events-auto flex w-full items-center justify-between rounded-[8px]"
        style={{
          padding: 4,
          border: "1px solid #dcc090",
          backgroundColor: "rgba(245, 244, 241, 0.55)",
          backdropFilter: "blur(14.5px)",
          WebkitBackdropFilter: "blur(14.5px)",
          fontSize: 11,
        }}
      >
        {COLLECTIONS.map((c) => {
          const active = selected.includes(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => onToggle(c)}
              aria-pressed={active}
              style={{ height: "2.35em", padding: "0 1em", borderRadius: "0.5em" }}
              className={`shrink-0 whitespace-nowrap font-montserrat font-bold text-black transition-colors ${
                active ? "bg-[#dcc090]" : "bg-transparent hover:bg-[#dcc090]/10"
              }`}
            >
              {label(c)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const t = useTranslations("Shop");
  const home = useTranslations("Home");
  const collectionLabel = (name: string) =>
    COLLECTION_KEYS[name] ? home(`collections.${COLLECTION_KEYS[name]}.name`) : name;

  const initialCollections = useMemo(() => {
    const value = searchParams.get("collection");
    return value && COLLECTIONS.includes(value) ? [value] : [];
  }, [searchParams]);

  const initialSize = searchParams.get("size");

  const [collections, setCollections] = useState<string[]>(initialCollections);
  const [size, setSize] = useState<string | null>(initialSize);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);

  const hasActiveFilters = collections.length > 0 || Boolean(size);

  const toggleCollection = (name: string) => {
    setCollections((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    );
  };

  const categories = useMemo(() => {
    let result = PRODUCT_CATEGORIES;
    if (collections.length > 0) {
      result = result.filter((c) => collections.includes(c.name));
    }
    if (size) {
      result = result
        .map((c) => ({ ...c, products: c.products.filter((p) => p.size === size) }))
        .filter((c) => c.products.length > 0);
    }
    return result;
  }, [collections, size]);

  const clearAll = () => {
    setCollections([]);
    setSize(null);
  };

  return (
    <main className="bg-[#f5f4f1]">
      <div className="shop-page mx-auto max-w-[120rem] px-4 pt-8 pb-20 sm:px-8 lg:px-[7.5rem]">
        <h1 className="text-[1.75rem] leading-none font-normal text-[#414141] sm:text-[2rem]">
          <span className="hidden font-extrabold lg:inline">{t("productLine")} </span>
          <span className="font-semibold">{t("line")}</span>
        </h1>

        <div className="shop-filter-row mt-6 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSizeModalOpen(true)}
            style={{ height: 36, padding: "0 14px", fontSize: 13, borderRadius: 8 }}
            className="flex-1 truncate bg-[#dcc090] text-left font-semibold text-[#122a26] shadow-[0_4px_22.5px_rgba(0,0,0,0.08)] transition-colors hover:bg-[#d3b57c]"
          >
            {size ?? t("selectCigarette")}
          </button>

          <button
            type="button"
            onClick={clearAll}
            disabled={!hasActiveFilters}
            aria-label="Reset filters"
            style={{ height: 36, width: 44, borderRadius: 8, border: "1px solid #dcc090" }}
            className="flex shrink-0 items-center justify-center text-[#dcc090] transition-colors hover:bg-[#dcc090]/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 12a9 9 0 1 1 3 6.7M3 12V6m0 6h6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="shop-divider mt-6 h-px bg-black/10" />

        <CollectionBar selected={collections} onToggle={toggleCollection} label={collectionLabel} />

        <div className="shop-list mt-8 flex flex-col gap-12">
          {categories.map((category) => (
            <section key={category.name} className="shop-category">
              <h2 className="shop-category-title text-xl font-extrabold text-[#414141] sm:text-2xl">
                {COLLECTION_COINS[category.name] && (
                  <span className="shop-coin relative hidden shrink-0">
                    <Image
                      src={COLLECTION_COINS[category.name]}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-contain"
                    />
                  </span>
                )}
                {collectionLabel(category.name)}
              </h2>
              <div className="shop-grid mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {category.products.map((product) => (
                  <ShopProductCard key={product.slug} product={product} />
                ))}
              </div>
            </section>
          ))}
          {categories.length === 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-[#9d9d9d]">{t("noResults")}</p>
              <button
                type="button"
                onClick={clearAll}
                className="shrink-0 text-sm font-bold text-[#dcc090] underline underline-offset-2 hover:text-[#d3b57c]"
              >
                {t("clearFilters")}
              </button>
            </div>
          )}
        </div>
      </div>

      <BrandSelectorModal
        open={sizeModalOpen}
        onClose={() => setSizeModalOpen(false)}
        onApply={(item) => {
          setSize(item.category);
          setSizeModalOpen(false);
        }}
      />
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopContent />
    </Suspense>
  );
}
