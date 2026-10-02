import Image from "next/image";
import Link from "next/link";
import type { StaticImageData } from "next/image";
import arrowIcon from "@/assets/images/homepage_redesign_assets/Arrow 1.png";

type CollectionRow = {
  number: string;
  title: string;
  description: string;
  href: string;
};

const ROWS: CollectionRow[] = [
  {
    number: "1",
    title: "Special Edition",
    description: "Limited covers made for a single drop, never repeated.",
    href: "/shop?collection=Special+Edition",
  },
  {
    number: "2",
    title: "Atelier",
    description: "Hand-finished exotic leathers, built to order.",
    href: "/shop?collection=Atelier",
  },
  {
    number: "3",
    title: "Premium",
    description: "Refined leather covers for everyday carry.",
    href: "/shop?collection=Premium",
  },
  {
    number: "4",
    title: "Classic",
    description: "The original Smoky Concepts silhouette.",
    href: "/shop?collection=Classic",
  },
];

type CoverCollectionsSectionProps = {
  image: StaticImageData;
};

export default function CoverCollectionsSection({ image }: CoverCollectionsSectionProps) {
  return (
    <section className="relative left-1/2 z-10 -mb-6 w-screen -mx-[50vw] overflow-hidden rounded-[1.5rem] bg-black px-6 pt-10 pb-10">
      <h2
        className="font-montserrat text-center text-white"
        style={{ fontSize: "34px", fontWeight: 800 }}
      >
        Cover Collections
      </h2>

      <div className="relative left-1/2 mt-8 w-screen -mx-[50vw]">
        <Image src={image} alt="Cover Collections" className="h-auto w-full" />
      </div>

      <div className="relative z-10 mt-[-140px] flex flex-col gap-3">
        {ROWS.map((row) => (
          <Link
            key={row.number}
            href={row.href}
            className="flex h-[83px] items-center gap-4 rounded-[24px] border border-white/20 bg-black px-4 transition-colors hover:border-[#dcc090]"
          >
            <span
              className="font-montserrat text-[#dcc090]"
              style={{ fontSize: "66px", fontWeight: 800 }}
            >
              {row.number}
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-extrabold text-white">{row.title}</h3>
              <p className="mt-0.5 text-xs text-white/60">{row.description}</p>
            </div>
            <span className="relative h-8 w-8 shrink-0">
              <Image src={arrowIcon} alt="" fill className="object-contain" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
