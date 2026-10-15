import type { StaticImageData } from "next/image";

import atelierCoin from "@/assets/images/covered_collections_section/atelier.png";
import classicCoin from "@/assets/images/covered_collections_section/classic.png";
import premiumCoin from "@/assets/images/covered_collections_section/premium.png";
import specialCoin from "@/assets/images/covered_collections_section/special.png";

// The product passport: the page a buyer reaches from a piece's own code (`/passport/classic`,
// ...), one for each collection. What is the piece's own (the serial number, the text on it,
// the day it was bought) is not known here yet, so it is shown as the placeholder in
// [brackets] until it comes from the registry.
export type Passport = {
  slug: string;
  collection: string;
  coin: StaticImageData;
  // The line under the name of the collection.
  tagline: string;
  // The code in the serial number between "SC-" and "-US-".
  code: string;
  model: string;
  size: string;
  shopHref: string;
};

export const PASSPORTS: Passport[] = [
  {
    slug: "classic",
    collection: "Classic",
    coin: classicCoin,
    tagline: "The everyday essential. Clean lines, high-quality leather, timeless color.",
    code: "CL",
    model: "Classic Black",
    size: "Ultra Slims",
    shopHref: "/shop?collection=Classic",
  },
  {
    slug: "premium",
    collection: "Premium",
    coin: premiumCoin,
    tagline: "Richer leathers, bolder character. Hand-finished in a color or texture of its own.",
    code: "PR",
    model: "Old Money",
    size: "Ultra Slims",
    shopHref: "/shop?collection=Premium",
  },
  {
    slug: "atelier",
    collection: "Atelier",
    coin: atelierCoin,
    tagline: "Made to order. Hand-assembled in our atelier to the exact size of your pack.",
    code: "AT",
    model: "Crocos",
    size: "Ultra Slims",
    shopHref: "/shop?collection=Atelier",
  },
  {
    slug: "special-edition",
    collection: "Special Edition",
    coin: specialCoin,
    tagline: "Limited designs, released once. Rare finishes and details for a single moment.",
    code: "SE",
    model: "Cascade",
    size: "Ultra Slims",
    shopHref: "/shop?collection=Special+Edition",
  },
];

export function findPassport(slug: string): Passport | undefined {
  return PASSPORTS.find((p) => p.slug === slug);
}
