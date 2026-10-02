"use client";

import { notFound, useParams } from "next/navigation";
import { useState } from "react";

import CustomizeModal, { type Customization } from "@/components/CustomizeModal";
import DeliveryInfo from "@/components/DeliveryInfo";
import HowToUse from "@/components/HowToUse";
import ProductCard from "@/components/ProductCard";
import ProductDescription from "@/components/ProductDescription";
import ProductGallery from "@/components/ProductGallery";
import SameSizeProducts from "@/components/SameSizeProducts";
import ShopByCategory from "@/components/ShopByCategory";
import SizeSelectorModal from "@/components/SizeSelectorModal";
import {
  findProductBySlug,
  formatPrice,
  PRODUCT_CATEGORIES,
} from "@/data/products";

const DETAILS = [
  { label: "Collection", value: "Classic" },
  { label: "Leather", value: "High Quality Leather" },
  { label: "Color", value: "Dark Brown" },
  { label: "Body", value: "PET Carbon Fiber" },
  { label: "Dimensions", value: "88 × 56 × 18 mm" },
  { label: "Weight", value: "45 g" },
  { label: "Finish", value: "Natural matte" },
  { label: "Construction", value: "Engineered core, wrapped and hand-finished in leather" },
];

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 8h12l-1 11a2 2 0 0 1-2 1.8H9A2 2 0 0 1 7 19L6 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 20l4.243-.707 10.607-10.607a1.5 1.5 0 0 0 0-2.121l-1.415-1.415a1.5 1.5 0 0 0-2.121 0L4.707 15.757 4 20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14.5 6.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const product = findProductBySlug(params.slug);

  const [size, setSize] = useState<string | null>(null);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);

  const [customization, setCustomization] = useState<Customization | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  if (!product) {
    notFound();
  }

  const allProducts = PRODUCT_CATEGORIES.flatMap((c) => c.products);
  const otherProducts = allProducts.filter((p) => p.slug !== product.slug);
  const related = [
    ...otherProducts.filter((p) => p.collection === "Premium"),
    ...otherProducts.filter((p) => p.collection !== "Premium"),
  ].slice(0, 6);
  const sameClass = allProducts.filter(
    (p) => p.slug !== product.slug && p.collection === product.collection,
  );

  return (
    <main className="bg-[#f5f4f1]">
      <div className="mx-auto max-w-[40rem] px-4 pt-5 pb-16">
        {/* Gallery */}
        <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_4px_22.5px_rgba(0,0,0,0.08)]">
          <ProductGallery
            images={[product.image, product.image, product.image, product.image]}
            alt={product.name}
            title={product.name}
          />
        </div>

        <SameSizeProducts collection={product.collection} products={sameClass} />

        {/* Core purchase decision (name, size, customize, price) */}
        <div className="mt-5 flex flex-col gap-5 rounded-[1.5rem] bg-white p-5 shadow-[0_4px_22.5px_rgba(0,0,0,0.08)]">
          <span className="inline-flex w-fit items-center rounded-full bg-[#122a26]/[0.06] px-3 py-1 text-[11px] font-bold tracking-wider text-[#122a26] uppercase">
            {product.size} · {product.collection}
          </span>

          <button
            type="button"
            onClick={() => setSizeModalOpen(true)}
            className="flex h-14 w-full items-center justify-between rounded-2xl bg-[#dcc090] px-5 text-left shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-transform active:scale-[0.98]"
          >
            <span className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold tracking-wider text-[#122a26]/70 uppercase">
                Size
              </span>
              <span className="text-[15px] leading-none font-extrabold text-[#122a26]">
                {size ?? "Select size"}
              </span>
            </span>
            <ChevronRightIcon className="h-5 w-5 shrink-0 text-[#122a26]" />
          </button>
          {product.collection === "Atelier" ? <> </> : 
            <div>
              <button
                type="button"
                onClick={() => setCustomizeOpen(true)}
                className={`flex h-11 w-full items-center justify-between rounded-full border-2 px-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all active:scale-[0.98] ${
                  product.collection === "Atelier"
                    ? "border-black text-black"
                    : "border-[#dcc090] text-[#dcc090]"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <PencilIcon className="h-4 w-4" /> 
                  <span className="text-xs font-extrabold tracking-[0.14em] uppercase">
                    {product.collection === "Atelier" ? "Personalize" : "Customize"}
                  </span>
                </span>
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              {customization?.text && (
                <div className="mt-3 rounded-2xl bg-[#dcc090]/10 px-4 py-3">
                  <p className="text-sm leading-snug text-[#414141]">
                    Customized: <span className="font-bold">“{customization.text}”</span> —{" "}
                    {customization.font}
                  </p>
                </div>
              )}
            </div>
          }
          <div className="h-px bg-black/5" />

          <div>
            <p className="text-[11px] font-bold tracking-wider text-[#898989] uppercase">
              Price
            </p>
            <p className="mt-1 text-[1.875rem] leading-none font-extrabold text-[#414141]">
              {formatPrice(product.price)}
            </p>
          </div>
        </div>

        <DeliveryInfo />

        {/* Purchase actions — sit right before the recommendations, in normal flow */}
        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            aria-label="Add to cart"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#122a26] text-[#122a26] shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform active:scale-90"
          >
            <CartIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="flex h-14 flex-1 items-center justify-between rounded-2xl bg-[#dcc090] px-5 shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-transform active:scale-[0.98]"
          >
            <span className="text-sm font-extrabold tracking-[0.14em] text-[#122a26] uppercase">
              Buy Now
            </span>
            <span className="text-base font-extrabold text-[#122a26]">
              {formatPrice(product.price)}
            </span>
          </button>
        </div>

        <section className="mt-10">
          <h2 className="text-[1.375rem] font-extrabold tracking-[-0.01em] text-[#414141]">
            Details
          </h2>
          <dl className="mt-4 overflow-hidden rounded-[1.5rem] bg-white shadow-[0_4px_22.5px_rgba(0,0,0,0.08)]">
            {DETAILS.map((d, index) => (
              <div
                key={d.label}
                className={`flex items-start justify-between gap-4 px-5 py-4 ${
                  index !== DETAILS.length - 1 ? "border-b border-black/5" : ""
                }`}
              >
                <dt className="shrink-0 text-sm text-[#898989]">{d.label}</dt>
                <dd className="max-w-[65%] text-right text-sm font-semibold text-[#414141]">
                  {d.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <ProductDescription />

        <div className="mt-8">
          <HowToUse />
        </div>

        <section className="mt-10">
          <h2 className="text-[1.375rem] font-extrabold tracking-[-0.01em] text-[#414141]">
            You May Also Like
          </h2>
          <div className="scrollbar-hide mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pt-2 pb-2">
            {related.map((p) => (
              <div key={p.slug} className="shrink-0 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>

        <ShopByCategory />
      </div>

      <SizeSelectorModal
        open={sizeModalOpen}
        onClose={() => setSizeModalOpen(false)}
        onApply={(item) => {
          setSize(item.category);
          setSizeModalOpen(false);
        }}
      />

      <CustomizeModal
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        onSave={setCustomization}
        initial={customization}
      />
    </main>
  );
}
