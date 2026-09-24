import Image from "next/image";
import Link from "next/link";

import { formatPrice, type Product } from "@/data/products";

export default function SameSizeProducts({
  collection,
  products,
}: {
  collection: string;
  products: Product[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="mt-5">
      <div className="flex items-end justify-between px-1">
        <h2 className="text-[1.125rem] font-extrabold tracking-[-0.01em] text-[#414141]">
          More in {collection} Collection
        </h2>
        <span className="shrink-0 text-xs font-semibold text-[#898989]">
          {products.length} styles
        </span>
      </div>

      <div className="scrollbar-hide mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
        {products.map((p) => (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            className="flex w-[13.5rem] shrink-0 snap-start items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-transform active:scale-[0.97]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#414141]">{p.name}</p>
              <p className="text-[11px] font-semibold text-[#898989]">{p.collection}</p>
              <p className="mt-1.5 text-sm font-extrabold text-[#414141]">
                {formatPrice(p.price)}
              </p>
            </div>
            <div className="relative h-16 w-14 shrink-0">
              <div className="absolute inset-x-0 -bottom-2 h-12 rounded-lg bg-[#f5f4f1]" />
              <Image
                src={p.image}
                alt={p.name}
                fill
                className="relative z-10 object-contain object-bottom"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
