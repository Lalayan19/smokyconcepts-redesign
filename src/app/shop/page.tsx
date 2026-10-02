"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import ShopProductCard from "@/components/ShopProductCard";
import SizeSelectorModal from "@/components/SizeSelectorModal";
import { PRODUCT_CATEGORIES } from "@/data/products";

const COLLECTIONS = PRODUCT_CATEGORIES.map((c) => c.name);

function ShopContent() {
  const searchParams = useSearchParams();

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
      <div className="mx-auto max-w-[120rem] px-4 pt-8 pb-20 sm:px-8 lg:px-[7.5rem]">
        <h1 className="text-[1.75rem] leading-none font-normal text-[#414141] sm:text-[2rem]">
          <span className="hidden font-extrabold lg:inline">Product Line: </span>
          <span className="font-semibold">Smoky Covers</span>
        </h1>

        <div className="mt-6 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSizeModalOpen(true)}
            className="h-14 flex-1 truncate rounded-[0.625rem] bg-[#dcc090] px-5 text-left text-base font-semibold text-[#122a26] shadow-[0_4px_22.5px_rgba(0,0,0,0.08)] transition-colors hover:bg-[#d3b57c]"
          >
            {size ?? "Select size"}
          </button>

          <button
            type="button"
            onClick={clearAll}
            disabled={!hasActiveFilters}
            aria-label="Reset filters"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[0.625rem] border-2 border-[#dcc090] text-[#dcc090] transition-colors hover:bg-[#dcc090]/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

        <div className="mt-6 h-px bg-black/10" />

        <div className="flex h-[60px] items-center gap-2 mt-4">
          {COLLECTIONS.map((c) => {
            const active = collections.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCollection(c)}
                aria-pressed={active}
                className={`h-9 min-w-0 flex-1 truncate rounded-[6px] border-2 px-2 text-[11px] font-semibold transition-colors sm:px-4 sm:text-xs ${
                  active
                    ? "border-[#dcc090] bg-[#dcc090] text-[#122a26] shadow-[0_4px_22.5px_rgba(0,0,0,0.08)]"
                    : "border-transparent bg-white text-[#414141] hover:border-[#dcc090]/50"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-12">
          {categories.map((category) => (
            <section key={category.name}>
              <h2 className="text-xl font-extrabold text-[#414141] sm:text-2xl">
                {category.name}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {category.products.map((product) => (
                  <ShopProductCard key={product.slug} product={product} />
                ))}
              </div>
            </section>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-[#9d9d9d]">No products match these filters.</p>
          )}
        </div>
      </div>

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

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopContent />
    </Suspense>
  );
}
