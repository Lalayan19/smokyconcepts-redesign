import Image from "next/image";
import Link from "next/link";

import { formatPrice, type Product } from "@/data/products";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group relative z-0 flex h-full min-h-0 max-sm:w-[calc((100vw-2.25rem)/1.72)] w-full shrink-0 flex-col overflow-visible rounded-[1.125rem] bg-white px-0 pt-[4.5rem] pb-4 shadow-[0_4px_22.5px_rgba(0,0,0,0.08)] hover:z-[8] focus-within:z-[8] sm:w-[11rem] sm:pt-[5rem] sm:pb-5 lg:w-[11rem] lg:pt-[4.5rem] xl:w-[11.5rem]">
      <div className="relative z-10 mb-0 flex h-[14.75rem] shrink-0 items-end justify-center overflow-visible -mt-[6rem] sm:mb-1 sm:h-[17.75rem] sm:-mt-[7rem] lg:h-[14.5rem] lg:-mt-[6.5rem]">
        <div className="relative h-[13.75rem] w-full transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.045] sm:h-[16.5rem] lg:h-[13.75rem]">
          <Link
            href={`/products/${product.slug}`}
            className="flex h-full w-full items-end justify-center"
          >
            <span className="relative flex h-[12rem] w-[8.5rem] -translate-y-[3.45rem] items-end justify-center overflow-hidden rounded-[0.875rem] bg-transparent sm:h-[14.25rem] sm:w-[10rem] sm:-translate-y-[3.55rem] lg:h-[12rem] lg:w-[8.75rem] lg:-translate-y-[3.25rem]">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain object-bottom"
              />
            </span>
          </Link>
        </div>
      </div>

      <div className="relative z-20 flex min-h-0 flex-1 flex-col justify-between -mt-[3.7rem] px-2.5 sm:-mt-[4.25rem] sm:px-3 lg:-mt-[3.5rem]">
        <div className="min-w-0">
          <div
            className="mb-0.5 flex min-h-3 items-center justify-center gap-1"
            aria-hidden="true"
          >
            <span className="block h-[0.25rem] w-[1.625rem] shrink-0 rounded-[0.15625rem] bg-[#122a26]" />
          </div>
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="line-clamp-1 text-[0.9375rem] leading-tight font-extrabold text-[#414141] sm:text-[1.0625rem]">
              {product.name}
            </h3>
          </Link>
          <div className="mt-0.5 flex items-center gap-1">
            <span className="inline-flex items-center px-0 py-0 text-[0.5625rem] leading-tight font-semibold text-[#122a26] sm:text-[0.625rem]">
              {product.size}
            </span>
            <span className="rounded-[0.3125rem] bg-[#122a26] px-[0.3125rem] py-px text-[0.5625rem] leading-tight font-medium text-white sm:rounded-[0.375rem] sm:px-[0.375rem] sm:py-[0.125rem] sm:text-[0.625rem]">
              {product.collection}
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 max-sm:mt-1">
          <span className="text-[0.75rem] leading-tight font-extrabold whitespace-nowrap text-black sm:text-[0.98rem]">
            {formatPrice(product.price).replace("֏", "")}
            <span className="ml-1 text-[0.78em]">֏</span>
          </span>
          <Link
            href={`/products/${product.slug}`}
            aria-label={`Buy — ${product.name}`}
            className="ml-0.5 inline-flex h-[1.375rem] min-w-[3.125rem] items-center justify-center rounded-[0.4375rem] border-2 border-[#dcc090] px-1.5 text-[0.6875rem] leading-tight font-extrabold text-[#dcc090] transition-colors hover:bg-[#dcc090]/10 sm:ml-1 sm:h-6 sm:min-w-[3.625rem] sm:rounded-[0.5rem] sm:px-2 sm:text-[0.75rem]"
          >
            Buy
          </Link>
        </div>
      </div>
    </article>
  );
}
