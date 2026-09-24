import type { StaticImageData } from "next/image";

import blackbone from "@/assets/images/Blackbone.webp";
import cascade from "@/assets/images/Cascade.webp";
import classicBlack from "@/assets/images/Classic-Black.webp";
import classicBrown from "@/assets/images/Classic-brown.webp";
import classicBlue from "@/assets/images/classic-blue.webp";
import crocos from "@/assets/images/Crocos.webp";
import forest from "@/assets/images/Forest.webp";
import karMir from "@/assets/images/Kar-Mir.webp";
import kishMish from "@/assets/images/Kish-Mish.webp";
import kishMish2 from "@/assets/images/Kish-Mish-2.webp";
import marMar from "@/assets/images/Mar-Mar.webp";
import oldMoney from "@/assets/images/Old-Money.webp";
import orangerie from "@/assets/images/Orangerine.webp";
import seaman from "@/assets/images/Seaman.webp";

export type Product = {
  name: string;
  slug: string;
  size: string;
  collection: string;
  price: number;
  image: StaticImageData;
  inStock?: boolean;
};

export type ProductCategory = {
  name: string;
  products: Product[];
};

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    name: "Classic",
    products: [
      { name: "Classic Brown", slug: "classic-brown", size: "Ultra Slims", collection: "Classic", price: 15900, image: classicBrown },
      { name: "Classic Blue", slug: "classic-blue", size: "Ultra Slims", collection: "Classic", price: 15900, image: classicBlue },
      { name: "Classic Black", slug: "classic-black", size: "Ultra Slims", collection: "Classic", price: 15900, image: classicBlack },
    ],
  },
  {
    name: "Premium",
    products: [
      { name: "Kar Mir", slug: "kar-mir", size: "Ultra Slims", collection: "Premium", price: 25900, image: karMir },
      { name: "Kish Mish", slug: "kish-mish", size: "Ultra Slims", collection: "Premium", price: 25900, image: kishMish },
      { name: "Mar Mar", slug: "mar-mar", size: "Ultra Slims", collection: "Premium", price: 24900, image: marMar },
      { name: "Kish Mish 2", slug: "kish-mish-2", size: "Ultra Slims", collection: "Premium", price: 25900, image: kishMish2 },
      { name: "Old Money", slug: "old-money", size: "Ultra Slims", collection: "Premium", price: 25900, image: oldMoney },
      { name: "Orangerie", slug: "orangerie", size: "Ultra Slims", collection: "Premium", price: 26900, image: orangerie },
      { name: "Blackbone", slug: "blackbone", size: "Ultra Slims", collection: "Premium", price: 25900, image: blackbone },
      { name: "Forest", slug: "forest", size: "Ultra Slims", collection: "Premium", price: 24900, image: forest },
      { name: "Seaman", slug: "seaman", size: "Ultra Slims", collection: "Premium", price: 24900, image: seaman },
    ],
  },
  {
    name: "Atelier",
    products: [
      { name: "Crocos", slug: "crocos", size: "Ultra Slims", collection: "Atelier", price: 129000, image: crocos, inStock: false },
    ],
  },
  {
    name: "Special",
    products: [
      { name: "Cascade", slug: "cascade", size: "Ultra Slims", collection: "Special Edition", price: 39800, image: cascade, inStock: false },
    ],
  },
];

const priceFormatter = new Intl.NumberFormat("ru-RU");

export function formatPrice(price: number) {
  return `${priceFormatter.format(price)}֏`;
}

export function findProductBySlug(slug: string): Product | undefined {
  for (const category of PRODUCT_CATEGORIES) {
    const product = category.products.find((p) => p.slug === slug);
    if (product) return product;
  }
  return undefined;
}

export function getAllProductSlugs(): string[] {
  return PRODUCT_CATEGORIES.flatMap((category) =>
    category.products.map((product) => product.slug),
  );
}
