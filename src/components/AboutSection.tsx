import Image from "next/image";
import Link from "next/link";
import type { StaticImageData } from "next/image";

type AboutSectionProps = {
  image: StaticImageData;
  buttonHref: string;
};

export default function AboutSection({ image, buttonHref }: AboutSectionProps) {
  return (
    <section className="relative left-1/2 flex w-screen -mx-[50vw] flex-col overflow-hidden bg-white pt-7 text-center">
      <div className="px-6">
        <h2
          className="font-montserrat italic text-[#130F0F] mt-[30px]"
          style={{ fontWeight: 800, fontSize: "35px", lineHeight: 1.1 }}
        >
          Present
        </h2>
        <p
          className="mx-auto font-montserrat text-left text-[#414141]"
          style={{ maxWidth: 300, fontSize: "12px", fontWeight: 500, }}
        >
          Smoky Concepts brings fresh ideas into real life. We study everyday
          rituals, find what&rsquo;s missing, and design the piece that feels
          right—more beautiful, more personal, more you.
        </p>

        <Link
          href={buttonHref}
          style={{
            marginTop: 24,
            // Above the bag, whose handles reach up behind the button.
            position: "relative",
            zIndex: 1,
            letterSpacing: "0.1em",
            border: "1px solid #122A26",
            fontWeight: 500,
          }}
          className="inline-flex h-[42px] w-[200px] items-center justify-center rounded-[8px] bg-[#dcc090] text-[14px] font-montserrat text-[#122a26] transition-colors hover:bg-[#d3b57c]"
        >
          STORY BEHIND
        </Link>
      </div>

      {/* The bag reaches up behind the button (only the lower parts of its
          handles show below it) and runs down to the bottom edge of the
          section. The text and the button above stay where they are. */}
      <Image
        src={image}
        alt="Smoky Concepts gift bag"
        sizes="(min-width: 610px) 560px, 92vw"
        className="mx-auto block h-auto"
        style={{ width: "92%", maxWidth: 560, marginTop: -30 }}
      />
    </section>
  );
}
