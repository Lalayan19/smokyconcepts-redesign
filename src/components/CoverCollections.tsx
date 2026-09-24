import Image from "next/image";
import Link from "next/link";

import classic from "@/assets/images/clssic.webp";
import premium from "@/assets/images/premium.webp";
import atelier from "@/assets/images/atelier.webp";
import specialEdition from "@/assets/images/special-edition.webp";

const COLLECTIONS = [
  { name: "Classic", image: classic, href: "/shop?category=classic" },
  { name: "Premium", image: premium, href: "/shop?category=premium" },
  { name: "Atelier", image: atelier, href: "/shop?category=atelier" },
  {
    name: "Special Edition",
    image: specialEdition,
    href: "/shop?category=special-edition",
  },
];

export default function CoverCollections() {
  return (
    <section className="flex flex-col gap-8 sm:gap-10">
      <h2 className="text-center text-[2.125rem] font-extrabold leading-[1.235] text-[#414141] sm:text-4xl sm:leading-tight">
        Cover Collections
      </h2>

      <div className="grid grid-cols-4 gap-2 sm:gap-8">
        {COLLECTIONS.map((c) => (
          <Link
            key={c.name}
            href={c.href}
            className="group flex flex-col rounded-xl bg-white p-2 shadow-[0_6px_24px_rgba(18,42,38,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_32px_rgba(18,42,38,0.12)] sm:rounded-[2rem] sm:px-6 sm:pt-8 sm:pb-4"
          >
            <div className="relative flex h-16 w-full items-end justify-center sm:-mt-16 sm:h-72">
              <Image
                src={c.image}
                alt={c.name}
                className="max-h-full w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-110"
              />
            </div>
            <h3 className="mt-2 text-center text-[10px] font-extrabold text-[#414141] transition-colors duration-300 group-hover:text-[#a9752e] sm:mt-6 sm:text-xl">
              {c.name}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
