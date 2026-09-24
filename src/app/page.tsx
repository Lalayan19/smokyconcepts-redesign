import ChooseCigaretteSection from "@/components/ChooseCigaretteSection";
import CoverCollections from "@/components/CoverCollections";
import HeroSlider from "@/components/HeroSlider";
import PromoSection from "@/components/PromoSection";

import atelier from "@/assets/images/atelier.jpg";
import atelierMobile from "@/assets/images/atelier-mobile.png";
import ultraSlim from "@/assets/images/ultra-slim.jpg";
import ultraSlimMobile from "@/assets/images/ultra-slim-mobile.png";

export default function Home() {
  return (
    <main className="flex flex-col gap-[140px] px-4 pt-8 pb-16 md:px-8 xl:px-[120px]">
      <HeroSlider />
      <PromoSection
        title="Atelier"
        desktopImage={atelier}
        mobileImage={atelierMobile}
        primaryHref="/shop"
        secondaryHref="/atelier"
      />
      <CoverCollections />
      <PromoSection
        title="Ultra Slim"
        desktopImage={ultraSlim}
        mobileImage={ultraSlimMobile}
        primaryHref="/shop"
        secondaryHref="/ultra-slim"
      />
      <ChooseCigaretteSection />
    </main>
  );
}
