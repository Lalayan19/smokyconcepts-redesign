import Image from "next/image";
import Link from "next/link";

import { formatPrice, type Product } from "@/data/products";

type ShopProductCardProps = {
  product: Product;
  // Fetch the picture right away instead of when the card is almost on screen
  // (for a row where cards slide in from the side, so they are never empty).
  eager?: boolean;
};

export default function ShopProductCard({ product, eager = false }: ShopProductCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      draggable={false}
      className="flex flex-col overflow-hidden rounded-2xl border border-[#e3e1db] bg-white transition-colors hover:border-[#dcc090]"
    >
      <div className="shop-card-art relative h-52 w-full shrink-0 bg-white sm:h-60">
        <Image
          src={product.image}
          alt={product.name}
          fill
          loading={eager ? "eager" : undefined}
          className="object-contain object-bottom p-4"
        />
      </div>

      <div className="mx-3 border-t border-[#e3e1db]" />

      <div className="flex flex-col gap-1 px-3 py-3">
        <h3 className="line-clamp-1 text-sm font-extrabold text-[#414141]">
          {product.name}
        </h3>
        <div className="flex min-w-0 items-center gap-1">
          <span className="shrink-0 text-[0.6875rem] font-semibold text-[#898989]">
            {product.size}
          </span>
          <span className="max-w-full truncate rounded-[0.25rem] bg-[#122a26] px-1 py-px text-[9px] leading-[1.4] font-medium text-white">
            {product.collection}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-sm font-extrabold text-black">
            {formatPrice(product.price)}
          </span>
          <span className="inline-flex h-6 min-w-[3.5rem] items-center justify-center rounded-[0.5rem] border-2 border-[#dcc090] px-2 text-xs font-extrabold text-[#dcc090]">
            Buy
          </span>
        </div>
      </div>
    </Link>
  );
}
