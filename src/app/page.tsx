"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import HeroVideoBanner from "@/components/HeroVideoBanner";
import HomeVideoLoader from "@/components/HomeVideoLoader";
import VideoDebug from "@/components/VideoDebug";
import ScrollReveal from "@/components/ScrollReveal";
import AtelierSection from "@/components/AtelierSection";
import CoverCollectionsSection from "@/components/CoverCollectionsSection";
import UltraSlimsSection from "@/components/UltraSlimsSection";
import PopularSizesSection from "@/components/PopularSizesSection";
import PersonalizationSection from "@/components/PersonalizationSection";
import AboutSection from "@/components/AboutSection";
import SayHiSection from "@/components/SayHiSection";
import BrandSelectorModal from "@/components/BrandSelectorModal";
import { useLocale, useTranslations } from "next-intl";

// How wide the longer row of the title is, in times its font size (measured in the page's font):
// on a tablet and larger the column of texts under it is as wide as that row, so the texts under it
// (the heading, the text, the button) are as wide as the title.
const UNLOCK_TITLE_WIDTH: Record<string, number> = { en: 7.52, ru: 9.1, hy: 8.8 };

import newAccessory from "@/assets/images/Unlock.png";

export default function Home() {
  const router = useRouter();
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  // The texts of the home page follow the language chosen in the header (messages/*.json).
  const t = useTranslations("Home");
  const locale = useLocale();

  return (
    <main className="flex flex-col">
        <HomeVideoLoader />
        <VideoDebug />
        <ScrollReveal />
        <HeroVideoBanner
          title={
            <>
              {t("unlock.titleRow1")}{" "}
              <br className="hero-banner-break" />
              {t("unlock.titleRow2")}
            </>
          }
          subtitle={t.rich("unlock.subtitle", {
            b: (chunks) => <strong className="font-semibold text-white">{chunks}</strong>,
          })}
          titleWidth={UNLOCK_TITLE_WIDTH[locale] ?? UNLOCK_TITLE_WIDTH.en}
          bottomHeading={t("unlock.heading")}
          bottomText={t.rich("unlock.text", { br: () => <br className="hero-phone-break" /> })}
          image={newAccessory}
          video="/videos/smoky-unlock.mp4"
          wideVideo="/videos/smoky-unlock-opener.mp4"
          buttonLabel={t("unlock.button")}
          buttonHref="/shop"
        />
      <AtelierSection buttonHref="/products/crocos" />

      <CoverCollectionsSection />

      <UltraSlimsSection buttonHref="/shop" />

      <PopularSizesSection onButtonClick={() => setSizeModalOpen(true)} />

      <PersonalizationSection buttonHref="/personalization" />

      <AboutSection buttonHref="/shop" />

      <SayHiSection />

      <BrandSelectorModal
        open={sizeModalOpen}
        onClose={() => setSizeModalOpen(false)}
        onApply={(item) => {
          setSizeModalOpen(false);
          router.push(`/shop?size=${encodeURIComponent(item.category)}`);
        }}
      />
    </main>
  );
}
