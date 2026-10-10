import Link from "next/link";
import Image from "next/image";
import type { StaticImageData } from "next/image";

import { BUTTON_EDGE } from "@/components/buttonEdge";

type PersonalizationSectionProps = {
  image: StaticImageData;
  buttonHref: string;
};

export default function PersonalizationSection({
  image,
  buttonHref,
}: PersonalizationSectionProps) {
  return (
    // White behind the black section's corners, except for the last 1.5rem: there
    // the About photo, which starts that far up behind this section, shows
    // through the rounded bottom corners. `z-10` keeps this section in front of it.
    <section
      className="relative left-1/2 z-10 w-screen -mx-[50vw]"
      style={{ background: "linear-gradient(to bottom, #ffffff calc(100% - 1.5rem), transparent 0)" }}
    >
      <div className="personalization-card flex h-[90vh] flex-col overflow-hidden rounded-[1.5rem] bg-black px-6 pt-12 text-center">
        <h2
          className="font-montserrat mt-[10px] italic text-white"
          style={{ fontWeight: 700, fontSize: "36px", lineHeight: 1.1 }}
        >
          Personalization
        </h2>
        <p
          className="mx-auto max-w-md font-montserrat text-white/80"
          style={{ fontSize: "13px", fontWeight: 500, }}
        >
          <strong className="font-bold text-white">Compatible</strong> Most of
          Ultra Slims sizes
        </p>

        {/* On a phone the picture comes first and the button is under it, at the
            bottom of the card; a tablet and larger have them the other way round
            (see `.personalization-card` in globals.css). */}
        <div
          className="personalization-art relative mt-8 min-h-0"
          // On a phone the picture has its own shape (so the button is right
          // under it); it gives up height, keeping its place, if the card is short.
          style={{ aspectRatio: `${image.width} / ${image.height}` }}
        >
          <Image src={image} alt="Personalization" fill className="object-contain object-top" />
        </div>

        <Link
          href={buttonHref}
          style={{ letterSpacing: "0.1em", textTransform: "uppercase", ...BUTTON_EDGE }}
          // The bottom of the picture is dark and empty, so on a phone the button
          // goes up into it (and is painted over it: `relative`).
          className="relative -mt-[72px] mb-10 inline-flex h-[42px] w-[220px] shrink-0 items-center justify-center self-center rounded-[8px] bg-[#dcc090] text-[20px] font-montserrat text-[#122a26] transition-colors hover:bg-[#d3b57c]"
        >
          Personalize
        </Link>
      </div>
    </section>
  );
}
