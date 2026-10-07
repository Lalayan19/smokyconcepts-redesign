import DragScroll from "@/components/DragScroll";
import ProductCard from "@/components/ProductCard";
import { PRODUCT_CATEGORIES } from "@/data/products";

export default function ShopByCategory() {
  return (
    <section className="mt-10">
      <div className="flex flex-col gap-8">
        {PRODUCT_CATEGORIES.map((category) => (
          <div key={category.name}>
            <h3 className="text-xl font-extrabold text-[#414141]">{category.name}</h3>
            <DragScroll className="scrollbar-hide mt-1 flex snap-x snap-mandatory gap-4 overflow-x-auto pt-2 pb-2">
              {category.products.map((product) => (
                <div key={product.slug} className="shrink-0 snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </DragScroll>
          </div>
        ))}
      </div>
    </section>
  );
}
