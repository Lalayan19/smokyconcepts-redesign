"use client";

import Image from "next/image";
import Link from "next/link";
import type { StaticImageData } from "next/image";

import { BUTTON_EDGE } from "@/components/buttonEdge";
import { useLocale, useTranslations } from "next-intl";

type AboutSectionProps = {
  image: StaticImageData;
  buttonHref: string;
};

// The photo is 402 x 668: the bag on its pedestal, with the empty top of the
// picture left for the text. It runs from one edge of the screen to the other
// and sets the height of the section; the text and the button are placed on it
// in percentages of that height, so on every phone they are in the same place
// on the picture (the title's middle 13.2% down, the button's middle 81.8%
// down, on the front of the pedestal).
const TEXT_TOP = "10.3%";
const BUTTON_MIDDLE = "81.8%";

// How wide each of the heading's two rows is, in times the font's size (measured in the page's
// font, italic 800, and a little more): the sentences "A Small Gift." and "A Lasting Impression."
// and the same in the other languages. If the heading in messages/*.json is changed, measure again.
const HEADING_EM: Record<string, [number, number]> = {
  EN: [6.7, 11.7],
  RU: [11.9, 16.3],
  HY: [6.1, 13.9],
};

// The heading is split after its first sentence: "A Small Gift." / "A Lasting Impression.".
function splitHeading(heading: string): string[] {
  const match = heading.match(/^(.*?[.։])\s+(.*)$/);
  return match ? [match[1], match[2]] : [heading];
}

export default function AboutSection({ image, buttonHref }: AboutSectionProps) {
  // The texts follow the language chosen in the header (messages/*.json).
  const t = useTranslations("Home");
  const language = useLocale().toUpperCase();
  const headingRows = splitHeading(t("about.heading"));
  return (
    // The top 1.5rem of the section is behind the Personalization section above
    // it (whose rounded bottom corners show the photo). The white is on the div
    // inside, which has the rounded bottom corners: the section itself is clear, so
    // behind those corners is the page's gray, in the 12px gap (`mb-3`) between
    // this section and "Say Hi" under it, the same gap as between Ultra Slims and
    // Popular Sizes.
    <section
      className="relative left-1/2 mb-3 w-screen -mx-[50vw] overflow-hidden text-center"
      style={{ marginTop: "-1.5rem" }}
    >
      <div className="overflow-hidden rounded-b-[1.5rem] bg-white">
        {/* On a wide screen the picture stops growing at 560px and is centered. */}
        <div className="about-split relative mx-auto" style={{ maxWidth: 560 }}>
          <Image
            src={image}
            alt="Smoky Concepts gift bag on a white pedestal"
            sizes="(min-width: 561px) 560px, 100vw"
            className="about-photo block h-auto w-full"
          />

          <div className="about-text absolute inset-x-0 px-6" style={{ top: TEXT_TOP }}>
            <h2 data-reveal="title"
              className="font-montserrat italic text-[#130F0F]"
              // The heading is two rows, one for each sentence; `containerType` makes `cqw` below
              // the width of the heading, so a row that is too wide for it is made smaller to be
              // one row (and is the font's size, 35px or what a larger screen has, when it fits).
              style={{ fontWeight: 800, fontSize: "35px", lineHeight: 1.1, containerType: "inline-size" }}
            >
              {headingRows.map((row, index) => (
                <span
                  key={index}
                  className="block whitespace-nowrap"
                  style={{
                    fontSize: `min(${index === 1 ? "0.6em" : "1em"}, calc(100cqw / ${HEADING_EM[language]?.[index] ?? HEADING_EM.EN[index]}))`,
                  }}
                >
                  {row}
                </span>
              ))}
            </h2>
            <p data-reveal="text"
              className="mt-[10px] mx-auto font-montserrat text-left text-[#414141]"
              style={{ maxWidth: 300, fontSize: "12px", fontWeight: 580, whiteSpace: "pre-line" }}
            >
              {t("about.text")}
            </p>
          </div>

          <Link
             
            href={buttonHref}
            style={{
              position: "absolute",
              top: BUTTON_MIDDLE,
              left: "50%",
              transform: "translate(-50%, -50%)",
              letterSpacing: "0.1em",
              fontWeight: 500,
              ...BUTTON_EDGE,
            }}
            className="about-button inline-flex h-[42px] min-w-[200px] items-center justify-center whitespace-nowrap px-4 uppercase rounded-[8px] bg-[#dcc090] text-[14px] font-montserrat text-[#122a26] transition-colors hover:bg-[#d3b57c]"
          >
            {t("unlock.button")}
          </Link>
        </div>
      </div>
    </section>
  );
}
