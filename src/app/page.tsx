"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import HeroVideoBanner from "@/components/HeroVideoBanner";
import HomeVideoLoader from "@/components/HomeVideoLoader";
import VideoDebug from "@/components/VideoDebug";
import AtelierSection from "@/components/AtelierSection";
import CoverCollectionsSection from "@/components/CoverCollectionsSection";
import UltraSlimsSection from "@/components/UltraSlimsSection";
import PopularSizesSection from "@/components/PopularSizesSection";
import PersonalizationSection from "@/components/PersonalizationSection";
import AboutSection from "@/components/AboutSection";
import SayHiSection from "@/components/SayHiSection";
import BrandSelectorModal from "@/components/BrandSelectorModal";

import newAccessory from "@/assets/images/Unlock.png";
import aboutUs from "@/assets/images/about_image_final.png";

export default function Home() {
  const router = useRouter();
  const [sizeModalOpen, setSizeModalOpen] = useState(false);

  return (
    <main className="flex flex-col">
        <HomeVideoLoader />
        <VideoDebug />
        <HeroVideoBanner
          title={
            <>
              New Accessory{" "}
              <br className="hero-banner-break" />
              Unlocked
            </>
          }
          subtitle={
            <>
              Unique <strong className="font-semibold text-white">Accessories</strong> for
              Your <strong className="font-semibold text-white">Rituals</strong>.
            </>
          }
          bottomHeading="Contrary"
          bottomText="The standard chunk of Lorem Ipsum used since the 1500s is reproduced below, The standard chunk of Lorem Ipsum used since the 1500s is reproduced below,The standard chunk of "
          image={newAccessory}
          video="/videos/smoky-unlock.mp4"
          wideVideo="/videos/smoky-unlock-opener.mp4"
          buttonLabel="Shop"
          buttonHref="/shop"
        />
      <AtelierSection buttonHref="/products/crocos" />

      <CoverCollectionsSection />

      <UltraSlimsSection buttonHref="/shop" />

      <PopularSizesSection onButtonClick={() => setSizeModalOpen(true)} />

      <PersonalizationSection buttonHref="/personalization" />

      <AboutSection image={aboutUs} buttonHref="/shop" />

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
