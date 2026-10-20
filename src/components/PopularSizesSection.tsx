"use client";

import { BUTTON_EDGE } from "@/components/buttonEdge";
import PopularSizesSlider from "@/components/PopularSizesSlider";
import { useLocale, useTranslations } from "next-intl";

type PopularSizesSectionProps = {
  onButtonClick: () => void;
};

export default function PopularSizesSection({ onButtonClick }: PopularSizesSectionProps) {
  // The texts follow the language chosen in the header (messages/*.json).
  const t = useTranslations("Home");
  const language = useLocale().toUpperCase();
  return (
    // A tap anywhere in the section opens the picker, same as the button
    // (the button's click bubbles up here; it stays a real button for keyboard
    // users). A sideways drag of the row of packs isn't a click.
    // A phone: the section is as tall as the Ultra Slims section above it (80% of the
    // screen's height, or the 686px its own content is if that is more; on an iPhone the
    // whole height of the screen: the same two rules as there), and what is in it starts
    // 28px lower than it did (the top padding is 76px, not 48). A tablet and larger have
    // their own height and padding (`.popular-sizes-section` in globals.css).
    <section
      onClick={onButtonClick}
      className="popular-sizes-section relative left-1/2 cursor-pointer rounded-t-[1.5rem] w-screen -mx-[50vw] h-[max(80vh,686px)] supports-[-webkit-touch-callout:none]:max-md:h-[max(100vh,686px)] overflow-hidden bg-white px-6 pt-[76px] pb-10 text-center [-webkit-tap-highlight-color:transparent]"
    >
      <h2 data-reveal="title"
        className="font-montserrat italic text-[#000000] "
        // 32px; the Russian and Armenian titles are wider (12.1 and 11.6 times their size) and are
        // made smaller on a phone, so they stay in one row.
        style={{
          fontWeight: 690,
          fontSize:
            language === "RU"
              ? "min(32px, calc((100vw - 3rem) / 12.3))"
              : language === "HY"
                ? "min(32px, calc((100vw - 3rem) / 11.7))"
                : "32px",
          lineHeight: 1.1,
        }}
      >
        {t("popularSizes.heading")}
      </h2>
      <p data-reveal="text"
        className="mx-auto max-w-md font-montserrat text-[#000000]"
        style={{ fontWeight: 500, fontSize: "14px", whiteSpace: "pre-line" }}
      >
        {t("popularSizes.text")}
      </p>

      {/* The button is under the text, above the packs (its distance from the text
          is set in globals.css). */}
      <button
        type="button"
        style={{fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", ...BUTTON_EDGE }}
        className="popular-sizes-button mx-auto flex h-[42px] w-fit min-w-[228px] items-center justify-center whitespace-nowrap px-4 rounded-[8px] bg-[#dcc090] text-[15px] font-montserrat text-[#122a26] transition-colors hover:bg-[#d3b57c]"
      >
        {t("popularSizes.button")}
      </button>

      {/* The row of packs, each with its name under it (its distance from the
          button is set in globals.css); on a phone the packs slide in a loop. */}
      <div className="popular-sizes-strip relative -mx-6">
        <PopularSizesSlider />
      </div>
    </section>
  );
}
