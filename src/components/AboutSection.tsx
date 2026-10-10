import Image from "next/image";
import Link from "next/link";
import type { StaticImageData } from "next/image";

import { BUTTON_EDGE } from "@/components/buttonEdge";

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

export default function AboutSection({ image, buttonHref }: AboutSectionProps) {
  return (
    // The top 1.5rem of the section is behind the Personalization section above
    // it (whose rounded bottom corners show the photo). The section itself is
    // white and its content is in a div with the rounded bottom corners, so what
    // shows behind the corners is white, not the page's gray.
    <section
      className="relative left-1/2 w-screen -mx-[50vw] overflow-hidden bg-white text-center"
      style={{ marginTop: "-1.5rem" }}
    >
      <div className="overflow-hidden rounded-b-[1.5rem]">
        {/* On a wide screen the picture stops growing at 560px and is centered. */}
        <div className="about-split relative mx-auto" style={{ maxWidth: 560 }}>
          <Image
            src={image}
            alt="Smoky Concepts gift bag on a white pedestal"
            sizes="(min-width: 561px) 560px, 100vw"
            className="about-photo block h-auto w-full"
          />

          <div className="about-text absolute inset-x-0 px-6" style={{ top: TEXT_TOP }}>
            <h2
              className="font-montserrat italic text-[#130F0F]"
              style={{ fontWeight: 800, fontSize: "35px", lineHeight: 1.1 }}
            >
              Present
            </h2>
            <p
              className="mt-[10px] mx-auto font-montserrat text-left text-[#414141]"
              style={{ maxWidth: 300, fontSize: "12px", fontWeight: 580 }}
            >
              Smoky Concepts brings fresh ideas into real life. We study everyday
              rituals, find what&rsquo;s missing, and design the piece that feels
              right—more beautiful, more personal, more you.
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
            className="about-button inline-flex h-[42px] w-[200px] items-center justify-center rounded-[8px] bg-[#dcc090] text-[14px] font-montserrat text-[#122a26] transition-colors hover:bg-[#d3b57c]"
          >
            SHOP
          </Link>
        </div>
      </div>
    </section>
  );
}
