"use client";

import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import CustomizeModal, { type Customization } from "@/components/CustomizeModal";
import DeliveryInfo from "@/components/DeliveryInfo";
import DragScroll from "@/components/DragScroll";
import HowToUse from "@/components/HowToUse";
import CareLimits from "@/components/CareLimits";
import { COLLECTION_KEYS } from "@/data/collectionKeys";
import ProductCard from "@/components/ProductCard";
import ProductDescription from "@/components/ProductDescription";
import ProductGallery from "@/components/ProductGallery";
import SameSizeProducts from "@/components/SameSizeProducts";
import ShopByCategory from "@/components/ShopByCategory";
import BrandSelectorModal from "@/components/BrandSelectorModal";
import {
  findProductBySlug,
  formatPrice,
  PRODUCT_CATEGORIES,
} from "@/data/products";

// The names of the details are in messages/*.json (`Product`); the values are as they were.
const DETAILS = [
  { key: "collection", value: "Classic" },
  { key: "leather", value: "High Quality Leather" },
  { key: "color", value: "Dark Brown" },
  { key: "body", value: "PET Carbon Fiber" },
  { key: "dimensions", value: "88 × 56 × 18 mm" },
  { key: "weight", value: "45 g" },
  { key: "finish", value: "Natural matte" },
  { key: "construction", value: "Engineered core, wrapped and hand-finished in leather" },
] as const;

// What customizing a Classic case costs on top of its price.
const CLASSIC_CUSTOMIZE_FEE = 2000;

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

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
  // The texts follow the language chosen in the header (messages/*.json).
  const t = useTranslations("Product");
  const shop = useTranslations("Shop");
  const home = useTranslations("Home");

  // The name of the cigarette picked in the list ("Chapman Cherry"), shown in the
  // size button.
  const [cigarette, setCigarette] = useState<string | null>(null);
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

  // A Classic case with a customization saved costs the fee on top of its price.
  // Only the Buy Now button shows the total; the Price in the card stays the
  // price of the case itself.
  const customizationFee =
    product.collection === "Classic" && customization?.text ? CLASSIC_CUSTOMIZE_FEE : 0;
  const totalPrice = product.price + customizationFee;

  return (
    <main className="bg-[#f5f4f1]">
      {/* On a phone the page is one column. The `contents` boxes below (the
          pictures, the collection's row, the purchase, the rest) have no box of
          their own there, so nothing changes; on a laptop (see `.product-layout`
          in globals.css) the pictures and the purchase are the two columns, with
          the collection's row under both and the rest under that. */}
      <div className="product-layout mx-auto max-w-[40rem] px-4 pt-5 pb-16">
        <div className="product-left contents">
        {/* Gallery */}
        <div className="product-gallery-card overflow-hidden rounded-[1.5rem] bg-white shadow-[0_4px_22.5px_rgba(0,0,0,0.08)]">
          <ProductGallery
            images={product.gallery ?? [product.image, product.image, product.image, product.image]}
            alt={product.name}
            title={product.name}
            fill={!!product.gallery}
          />
        </div>
        </div>

        <div className="product-samesize contents">
        <SameSizeProducts
          key={product.slug}
          collection={product.collection}
          products={sameClass}
        />
        </div>

        <div className="product-right contents">
        {/* The name of the product, between the collection row and the
            purchase choices: just the name, on the page itself. */}
        <h2
          className="product-name mt-5 px-3.5 font-montserrat leading-snug text-black"
          style={{ fontSize: 18, fontWeight: 700 }}
        >
          {product.name}
        </h2>

        {/* Core purchase decision (name, size, customize, price) */}
        <div className="product-card mt-5 flex flex-col gap-5 rounded-[1.5rem] bg-white p-5 shadow-[0_4px_22.5px_rgba(0,0,0,0.08)]">
          {/* On a tablet and larger the name is here, in the card, above the
              size and collection (and not above the card, nor in the pictures). */}
          <h2
            className="product-card-name hidden font-montserrat leading-snug text-black"
            style={{ fontSize: 22, fontWeight: 700 }}
          >
            {product.name}
          </h2>
          <span className="inline-flex w-fit items-center rounded-full bg-[#122a26]/[0.06] px-3 py-1 text-[11px] font-bold tracking-wider text-[#122a26] uppercase">
            {product.size} ·{" "}
            {COLLECTION_KEYS[product.collection]
              ? home(`collections.${COLLECTION_KEYS[product.collection]}.name`)
              : product.collection}
          </span>

          <button
            type="button"
            onClick={() => setSizeModalOpen(true)}
            className="flex h-14 w-full items-center justify-between gap-3 rounded-2xl bg-[#dcc090] px-5 text-left shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-transform active:scale-[0.98]"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[10px] font-bold tracking-wider text-[#122a26]/70 uppercase">
                {t("size")}
              </span>
              {/* `truncate` hides what is outside the line's box, and a 15px line
                  (leading-none) cut the tails of letters like g and y: the line is
                  taller (the button has the room). */}
              <span className="truncate text-[15px] leading-[1.35] font-extrabold text-[#122a26]">
                {cigarette ?? shop("selectCigarette")}
              </span>
            </span>
            <ChevronRightIcon className="h-5 w-5 shrink-0 text-[#122a26]" />
          </button>
          {product.collection === "Atelier" ? (
            // An Atelier case is made to order, so there is no customizing here and
            // no button in its place.
            null
          ) :
            <div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCustomizeOpen(true)}
                  className={`flex h-11 min-w-0 flex-1 items-center justify-between rounded-full border-2 px-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all active:scale-[0.98] ${
                    product.collection === "Atelier"
                      ? "border-black text-black"
                      : "border-[#dcc090] text-[#dcc090]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <PencilIcon className="h-4 w-4" />
                    <span className="text-xs font-extrabold tracking-[0.14em] uppercase">
                      {product.collection === "Atelier" ? "Personalize" : t("customize")}
                    </span>
                  </span>
                  {/* What customizing costs on top, for the Classic collection:
                      inside the button, before the arrow, on every screen. */}
                  {product.collection === "Classic" && (
                    <span className="ml-auto mr-3 whitespace-nowrap text-[14px] font-extrabold text-[#414141]">
                      +{formatPrice(CLASSIC_CUSTOMIZE_FEE)}
                    </span>
                  )}
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
              {customization?.text && (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-[#dcc090]/10 px-4 py-3">
                  <p className="min-w-0 text-sm leading-snug text-[#414141]">
                    Customized: <span className="font-bold">“{customization.text}”</span> —{" "}
                    {customization.font}
                  </p>
                  {/* Cancels the customization (and so the extra cost). It is
                      taller than the text and sits partly in the box's padding
                      (the negative margins), so the text keeps its room and the
                      box keeps the height it had. */}
                  <button
                    type="button"
                    aria-label="Cancel customization"
                    onClick={() => setCustomization(null)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#414141]/60 transition-colors hover:bg-black/5 hover:text-[#414141]"
                    style={{ margin: "-2px -8px -2px 0" }}
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          }
          <div className="h-px bg-black/5" />

          <div>
            <p className="text-[11px] font-bold tracking-wider text-[#898989] uppercase">
              {t("price")}
            </p>
            <p className="mt-1 text-[1.875rem] leading-none font-extrabold text-[#414141]">
              {formatPrice(product.price)}
            </p>
          </div>
        </div>

        <DeliveryInfo />

        {/* Purchase actions — sit right before the recommendations, in normal flow */}
        <div className="product-actions mt-8 flex items-center gap-3">
          <button
            type="button"
            aria-label={t("addToCart")}
            className="product-cart flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#122a26] text-[#122a26] shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform active:scale-90"
          >
            <CartIcon className="product-cart-icon h-6 w-6" />
            {/* On a tablet and larger the button says it, instead of the icon. */}
            <span className="product-cart-label hidden text-sm font-extrabold tracking-[0.14em] uppercase">
              {t("addToCart")}
            </span>
          </button>
          <button
            type="button"
            className="product-buy flex h-14 flex-1 items-center justify-between rounded-2xl bg-[#dcc090] px-5 shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-transform active:scale-[0.98]"
          >
            <span className="text-sm font-extrabold tracking-[0.14em] text-[#122a26] uppercase">
              {t("buyNow")}
            </span>
            <span className="text-base font-extrabold text-[#122a26]">
              {formatPrice(totalPrice)}
            </span>
          </button>
        </div>
        </div>

        <div className="product-rest contents">
        {/* On a tablet and larger this line is the heading of the card, above it and outside it
            like "Product Story" (the word "Details" in the card is not shown there). */}
        <p className="product-details-sub hidden">{t("specifications")}</p>
        <section className="product-details mt-10">
          <h2 className="product-details-title text-[1.375rem] font-extrabold tracking-[-0.01em] text-[#414141]">
            {t("detailsTitle")}
          </h2>
          <dl className="product-details-list mt-4 overflow-hidden rounded-[1.5rem] bg-white shadow-[0_4px_22.5px_rgba(0,0,0,0.08)]">
            {DETAILS.map((d, index) => (
              <div
                key={d.key}
                className={`flex items-start justify-between gap-4 px-5 py-4 ${
                  index !== DETAILS.length - 1 ? "border-b border-black/5" : ""
                }`}
              >
                <dt className="shrink-0 text-sm text-[#898989]">{t(d.key)}</dt>
                <dd className="max-w-[65%] text-right text-sm font-semibold text-[#414141]">
                  {d.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="product-story contents">
          <ProductDescription />
        </div>

        <div className="product-howto mt-8">
          <HowToUse />
        </div>

        <div className="product-care mt-8">
          <CareLimits />
        </div>

        <section className="product-related mt-10">
          <h2 className="text-[1.375rem] font-extrabold tracking-[-0.01em] text-[#414141]">
            {t("alsoLike")}
          </h2>
          <DragScroll className="scrollbar-hide mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pt-2 pb-2">
            {related.map((p) => (
              <div key={p.slug} className="shrink-0 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </DragScroll>
        </section>

        <div className="product-shopby contents">
          <ShopByCategory />
        </div>
        </div>
      </div>

      <BrandSelectorModal
        open={sizeModalOpen}
        onClose={() => setSizeModalOpen(false)}
        onApply={(item) => {
          setCigarette(item.name);
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
