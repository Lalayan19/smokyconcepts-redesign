import Banner from "@/components/Banner";

import classic from "@/assets/images/Classic-brown.webp";
import premium from "@/assets/images/Old-Money.webp";
import atelier from "@/assets/images/Atelier.png";
import specialEdition from "@/assets/images/Cascade.webp";

const COLLECTIONS = [
  { title: "Classic", image: classic, buttonHref: "/shop?collection=Classic" },
  { title: "Premium", image: premium, buttonHref: "/shop?collection=Premium" },
  { title: "Atelier", image: atelier, buttonHref: "/products/crocos" },
  {
    title: "Special Edition",
    image: specialEdition,
    buttonHref: "/shop?collection=Special+Edition",
  },
];

export default function CollectionsPage() {
  return (
    <main className="animate-page-slide-in-left relative flex flex-col pt-3">
      {COLLECTIONS.map((collection) => (
        <Banner
          key={collection.title}
          title={collection.title}
          image={collection.image}
          buttonLabel="Shop Now"
          buttonHref={collection.buttonHref}
        />
      ))}
    </main>
  );
}
