"use client";

import Link from "next/link";

import { BUTTON_EDGE } from "@/components/buttonEdge";
import { useLocale, useTranslations } from "next-intl";
import ScrollVideo from "@/components/ScrollVideo";
import { PERSONALIZED_VIDEO } from "@/lib/homeVideos";

// How the video plays (see ScrollVideo), the same as the Atelier videos (see
// AtelierSection.tsx): no hold, and later than it used to start. It has played to its last
// frame exactly when the card is in the middle of the window, and starts when its top is
// this share of the window's height further down; scrolling back up it plays backwards at
// once.
const PERSONALIZATION_RAMP = 0.435;
// It played over 0.55 of the window's height of scroll, ending in the middle. Now it starts 5
// of the video's 24 original frames of scroll later (5/24 of 0.55 = 0.115) at the same
// speed, so it ends that much past the middle: 0.435 - (-0.115) is still 0.55.
const PERSONALIZATION_RAMP_END = -0.115;

type PersonalizationSectionProps = {
  buttonHref: string;
};

export default function PersonalizationSection({ buttonHref }: PersonalizationSectionProps) {
  // The texts follow the language chosen in the header (messages/*.json).
  const t = useTranslations("Home");
  const language = useLocale().toUpperCase();
  return (
    // White behind the black section's corners, except for the last 1.5rem: there
    // the About photo, which starts that far up behind this section, shows
    // through the rounded bottom corners. `z-10` keeps this section in front of it.
    <section
      className="group relative left-1/2 z-10 w-screen -mx-[50vw]"
      style={{ background: "linear-gradient(to bottom, #ffffff calc(100% - 1.5rem), transparent 0)" }}
    >
      <div className="personalization-card flex h-[105vh] flex-col overflow-hidden rounded-[1.5rem] bg-black px-6 pt-12 text-center">
        <h2 data-reveal="title"
          className="font-montserrat mt-[10px] italic text-white"
          // 36px; the Russian and Armenian titles are in capitals and wider, so on a narrow phone
          // they are made smaller to stay in one row.
          style={{
            fontWeight: 700,
            fontSize:
              language === "RU"
                ? "min(36px, calc((100vw - 3rem) / 11))"
                : language === "HY"
                  ? "min(36px, calc((100vw - 3rem) / 10.4))"
                  : "36px",
            lineHeight: 1.1,
          }}
        >
          {t("personalization.heading")}
        </h2>
        <p data-reveal="text"
          className="mx-auto max-w-md font-montserrat text-white/80"
          style={{ fontSize: "13px", fontWeight: 500 }}
        >
          {t("personalization.text")}
        </p>

        {/* On a phone the video comes first and the button is under it; a tablet and
            larger have them the other way round (see `.personalization-card` in
            globals.css). The video is played by the scroll (see ScrollVideo and
            `.personalization-art-video` in globals.css), on every screen. */}
        <div className="personalization-art relative mt-8 min-h-0">
          <ScrollVideo
            src={PERSONALIZED_VIDEO}
            sectionSelector=".personalization-card"
            windows="all"
            className="personalization-art-video"
            ramp={PERSONALIZATION_RAMP}
            rampEnd={PERSONALIZATION_RAMP_END}
            // The file is the original 24 frames with two more made between each pair
            // (70 frames), so the scroll plays it in finer steps.
            frames={70}
            fallbackFolder="personalized"
          />
        </div>

        <Link
         
          href={buttonHref}
          style={{ letterSpacing: "0.1em", textTransform: "uppercase", ...BUTTON_EDGE }}
          className="relative -mt-[72px] mb-10 inline-flex h-[42px] min-w-[220px] shrink-0 items-center justify-center self-center whitespace-nowrap px-4 rounded-[8px] bg-[#dcc090] text-[20px] font-montserrat text-[#122a26] transition-colors group-hover:bg-[#d3b57c]"
        >
          {t("personalization.button")}
        </Link>
      </div>

      {/* The whole section is a link to the Personalization page: this covers it (it is
          not inside the card, so the card's rules for its own links do not touch it). The
          button above is the same link, which shows the button's hover colour (`group`). */}
      <Link
        href={buttonHref}
        aria-label="Personalization"
        tabIndex={-1}
        className="absolute inset-0 z-20"
      />
    </section>
  );
}
