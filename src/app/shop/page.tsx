"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import cigaretteIcon from "@/assets/images/cigarete-icon.svg";
import MobileFilterDrawer from "@/components/MobileFilterDrawer";
import ProductCard from "@/components/ProductCard";
import SizeSelectorModal from "@/components/SizeSelectorModal";
import { PRODUCT_CATEGORIES } from "@/data/products";

const COLLECTIONS = PRODUCT_CATEGORIES.map((c) => c.name);
const COLORS = ["Black", "Brown", "Blue", "Green", "Red", "Gold"];
const SORT_OPTIONS = [
  "Price: low to high",
  "Price: high to low",
  "Name: A to Z",
  "Name: Z to A",
];

const SELECT_CLASS =
  "h-10 w-full appearance-none rounded-[0.375rem] border-2 border-transparent bg-white px-4 pr-10 text-[0.9375rem] leading-none font-semibold text-[#414141] shadow-[0_4px_22.5px_rgba(0,0,0,0.1)] outline-none transition-[box-shadow,ring,border-color,background-color,color] focus:shadow-[0_4px_24px_rgba(18,42,38,0.18)]";

function ChevronIcon() {
  return (
    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#414141]">
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

export default function ShopPage() {
  const [collection, setCollection] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const hasActiveFilters = Boolean(collection || color || sortBy || size);

  const categories = useMemo(() => {
    let result = PRODUCT_CATEGORIES;

    if (collection) {
      result = result.filter((c) => c.name === collection);
    }

    if (sortBy) {
      result = result.map((c) => {
        const products = [...c.products];
        products.sort((a, b) => {
          if (sortBy === "Price: low to high") return a.price - b.price;
          if (sortBy === "Price: high to low") return b.price - a.price;
          if (sortBy === "Name: A to Z") return a.name.localeCompare(b.name);
          return b.name.localeCompare(a.name);
        });
        return { ...c, products };
      });
    }

    return result;
  }, [collection, sortBy]);

  const clearAll = () => {
    setCollection(null);
    setColor(null);
    setSortBy(null);
    setSize(null);
  };

  return (
    <main className="bg-[#f5f4f1]">
      <div className="mx-auto max-w-[120rem] px-4 pt-8 pb-20 sm:px-8 lg:px-[7.5rem]">
        <div className="flex flex-col gap-8">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-[1.75rem] leading-none font-normal text-[#414141] sm:text-[2rem]">
              <span className="hidden font-extrabold lg:inline">Product Line: </span>
              <span className="font-semibold">Smoky Covers</span>
            </h1>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="mt-0.5 h-10 shrink-0 rounded-md bg-[#dcc090] px-7 text-sm leading-none font-black tracking-[0.14em] text-[#1a1d1c] uppercase transition-colors hover:bg-[#d2b68c] lg:hidden"
            >
              Filter
            </button>
          </div>

          <div className="hidden lg:flex lg:flex-wrap lg:items-center lg:gap-4">
            <div className="flex h-[7rem] w-[6.5rem] flex-col items-center justify-center gap-2 rounded-xl border-2 border-[#dcc090] bg-white">
              <Image src={cigaretteIcon} alt="" className="h-10 w-auto" />
              <span className="text-center text-[11px] leading-tight font-medium text-[#414141]">
                Cigarette
                <br />
                Packs
              </span>
            </div>
            <div className="flex h-[7rem] w-[6.5rem] flex-col items-center justify-center gap-2 rounded-xl bg-white/50 opacity-50">
              <span className="text-center text-[11px] leading-tight font-medium text-[#414141]">
                Money
                <br />
                Coming Soon
              </span>
            </div>
            <div className="flex h-[7rem] w-[6.5rem] flex-col items-center justify-center gap-2 rounded-xl bg-white/50 opacity-50">
              <span className="text-center text-[11px] leading-tight font-medium text-[#414141]">
                Phone Cases
                <br />
                Coming Soon
              </span>
            </div>
          </div>

          <div className="hidden lg:flex lg:flex-wrap lg:items-center lg:gap-3">
            <label className="relative block w-[9.5rem]">
              <select
                className={SELECT_CLASS}
                value={collection ?? "all"}
                onChange={(e) =>
                  setCollection(e.target.value === "all" ? null : e.target.value)
                }
              >
                <option value="all">Collections</option>
                {COLLECTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronIcon />
            </label>

            <label className="relative block w-[8rem]">
              <select
                className={SELECT_CLASS}
                value={color ?? "all"}
                onChange={(e) => setColor(e.target.value === "all" ? null : e.target.value)}
              >
                <option value="all">Color</option>
                {COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronIcon />
            </label>

            <button
              type="button"
              onClick={() => setSizeModalOpen(true)}
              className="h-10 w-[9.5rem] rounded-[0.5rem] border-2 border-transparent bg-[#dcc090] px-4 text-left text-[0.9375rem] leading-none font-semibold whitespace-nowrap text-[#122a26] transition-[box-shadow,ring,border-color,background-color,color]"
            >
              {size ?? "Select size"}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="h-10 rounded-[0.5rem] border-2 border-[#dcc090] px-2 text-[0.5625rem] leading-none font-black tracking-[0.01em] whitespace-nowrap text-[#dcc090] uppercase transition-colors hover:bg-[#dcc090]/10"
              >
                Clear All
              </button>
            )}

            <label className="relative ml-auto block w-[9.5rem]">
              <select
                className={`${SELECT_CLASS} font-extrabold`}
                value={sortBy ?? "default"}
                onChange={(e) =>
                  setSortBy(e.target.value === "default" ? null : e.target.value)
                }
              >
                <option value="default">Sort By</option>
                {SORT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronIcon />
            </label>
          </div>
        </div>

        <div className="mt-10 space-y-16 lg:space-y-20">
          {categories.map((category) => (
            <section key={category.name} className="overflow-visible">
              <h2 className="text-[2rem] leading-none font-extrabold text-[#414141] sm:text-[2.25rem]">
                {category.name}
              </h2>
              <div className="scrollbar-hide mt-0.5 overflow-x-auto overflow-y-visible pt-[5.5rem] pb-6 sm:pt-[6rem] sm:pb-12 lg:-ml-[7.5rem] lg:w-[calc(100%+7.5rem)] lg:pt-[5.75rem] lg:pb-14">
                <div className="flex min-w-max items-stretch gap-4 pr-5 max-sm:snap-x max-sm:snap-mandatory sm:gap-7 sm:pr-8 lg:-ml-10 lg:gap-10 lg:pl-10 lg:pr-[7.5rem]">
                  <div
                    className="hidden shrink-0 lg:block lg:w-[5rem]"
                    aria-hidden="true"
                  />
                  {category.products.map((product) => (
                    <div key={product.slug} className="shrink-0 max-sm:snap-center">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-[#9d9d9d]">No products match these filters.</p>
          )}
        </div>
      </div>

      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        collections={COLLECTIONS}
        colors={COLORS}
        sortOptions={SORT_OPTIONS}
        collection={collection}
        color={color}
        sortBy={sortBy}
        size={size}
        onCollectionChange={setCollection}
        onColorChange={setColor}
        onSortByChange={setSortBy}
        onOpenSizeModal={() => setSizeModalOpen(true)}
        onClearAll={clearAll}
      />

      <SizeSelectorModal
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
