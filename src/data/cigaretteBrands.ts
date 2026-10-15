import type { StaticImageData } from "next/image";

import { CIGARETTE_SIZES } from "@/data/cigaretteSizes";

// The brands and their cigarettes, made from the list of sizes (cigaretteSizes.ts):
// every name in it starts with the brand ("Ararat Perla" is Ararat's Perla), and
// the same cigarette can be in more than one size.

export type BrandProduct = {
  name: string;
  // The size it comes in (Ultra Slims, Compact, ...).
  category: string;
  // How many times the list of sizes has it in that size (the same name more
  // than once means more than one version of it).
  versions: number;
  // Which of its versions this is (1, 2, ...) when it has more than one: each version is
  // its own entry in the list ("Akhtamar MT v1", "Akhtamar MT v2"). 0 when it has one.
  version: number;
  // How it is shown: the name, and "v1" after it when it has more than one version.
  label: string;
  // `name` in lower case, to search in.
  key: string;
  // The other names it is looked for by (what people call it), in lower case. Empty
  // for most cigarettes (see ALIASES).
  aliases: string[];
};

export type Brand = {
  name: string;
  // `name` in lower case, to search in.
  key: string;
  // From A to Z.
  products: BrandProduct[];
};

// The brands that are more than the first word of the name. (Every other brand is
// just the first word: "Ararat", "L&M", "TEREA".)
const MULTI_WORD_BRANDS = [
  "Be the Center",
  "Black Tip",
  "Crown of Armenia",
  "Multi Class",
  "Multi Tabak",
  "Philip Morris",
  "Red Line",
  "The One",
];

// The pictures of the brands (by the brand's name): none yet, a brand without one
// is drawn with the pack icon.
export const BRAND_IMAGES: Record<string, StaticImageData> = {};

// The other names a cigarette is looked for by: the key is the cigarette's name (in
// lower case), a bar, and its size; the value is what people type for it (in lower
// case). Typing one of these (from its first letter, three at least) lists that
// cigarette, and only that one.
const ALIASES: Record<string, string[]> = {
  "ararat silver|Ultra Slims": ["seri barak ararat"],
};

function brandOf(productName: string) {
  const lower = productName.toLowerCase();
  for (const brand of MULTI_WORD_BRANDS) {
    const key = brand.toLowerCase();
    if (lower === key || lower.startsWith(`${key} `)) return brand;
  }
  return productName.split(" ")[0];
}

const compareNames = (a: string, b: string) =>
  a.localeCompare(b, "en", { sensitivity: "base", numeric: true });

function buildBrands(): Brand[] {
  // The same brand is written in more than one way in the list ("Esse", "ESSE");
  // it is one brand, shown the way it is written most often.
  const spellings = new Map<string, Map<string, number>>();
  const products = new Map<string, Map<string, BrandProduct>>();

  CIGARETTE_SIZES.forEach((category) => {
    category.items.forEach((itemName) => {
      const brandName = brandOf(itemName);
      const brandKey = brandName.toLowerCase();

      const counts = spellings.get(brandKey) ?? new Map<string, number>();
      counts.set(brandName, (counts.get(brandName) ?? 0) + 1);
      spellings.set(brandKey, counts);

      const ofBrand = products.get(brandKey) ?? new Map<string, BrandProduct>();
      const productKey = `${itemName.toLowerCase()}|${category.name}`;
      const known = ofBrand.get(productKey);
      if (known) {
        known.versions += 1;
      } else {
        ofBrand.set(productKey, {
          name: itemName,
          category: category.name,
          versions: 1,
          version: 0,
          label: itemName,
          key: itemName.toLowerCase(),
          aliases: ALIASES[productKey] ?? [],
        });
      }
      products.set(brandKey, ofBrand);
    });
  });

  const sizeOrder = new Map(CIGARETTE_SIZES.map((category, i) => [category.name, i]));

  return [...spellings.entries()]
    .map(([key, counts]): Brand => {
      const name = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      // A cigarette with more than one version is listed once for each of them.
      const entries = [...(products.get(key)?.values() ?? [])].flatMap((p) =>
        p.versions > 1
          ? Array.from({ length: p.versions }, (_, i): BrandProduct => ({
              ...p,
              version: i + 1,
              label: `${p.name} v${i + 1}`,
            }))
          : [p],
      );
      const list = entries.sort(
        (a, b) =>
          compareNames(a.name, b.name) ||
          (sizeOrder.get(a.category) ?? 0) - (sizeOrder.get(b.category) ?? 0) ||
          a.version - b.version,
      );
      return { name, key, products: list };
    })
    .sort((a, b) => compareNames(a.name, b.name));
}

// All the brands, from A to Z.
export const BRANDS: Brand[] = buildBrands();

// The cigarettes that have another name to look for them by, with their brands.
export const ALIASED_PRODUCTS: { brand: Brand; product: BrandProduct }[] = BRANDS.flatMap(
  (brand) =>
    brand.products.filter((p) => p.aliases.length > 0).map((product) => ({ brand, product })),
);

// The cigarettes whose other name starts with what is typed (`text` is lower case,
// and at least three letters: fewer would pull one in for every brand that starts
// with the same letters).
export function findByAlias(text: string) {
  if (text.length < 3) return [];
  return ALIASED_PRODUCTS.filter(({ product }) =>
    product.aliases.some((alias) => alias.startsWith(text)),
  );
}
