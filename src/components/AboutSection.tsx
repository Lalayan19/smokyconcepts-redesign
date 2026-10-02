import Link from "next/link";
import type { StaticImageData } from "next/image";

type AboutSectionProps = {
  image: StaticImageData;
  buttonHref: string;
};

export default function AboutSection({ image, buttonHref }: AboutSectionProps) {
  return (
    <section className="relative left-1/2 flex aspect-[480/747] w-screen -mx-[50vw] flex-col overflow-hidden bg-[#f8f8f8] pt-7 text-center">
      <div
        className="absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: `url("${image.src}")`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />

      <div className="relative px-6">
        <h2
          className="font-montserrat italic text-[#414141]"
          style={{ fontWeight: 800, fontSize: "32px", lineHeight: 1.1 }}
        >
          Perfect Gift
        </h2>
        <p
          className="mx-auto mt-2 max-w-md font-montserrat text-center text-[#414141]"
          style={{ fontSize: "14px" }}
        >
          Smoky Concepts brings fresh ideas into real life. We study everyday
          rituals, find what&rsquo;s missing, and design the piece that feels
          right—more beautiful, more personal, more you.
        </p>
      </div>

      <div className="relative z-10 mt-auto flex justify-center px-6 pb-10">
        <Link
          href={buttonHref}
          style={{ letterSpacing: "0.1em" }}
          className="inline-flex h-10 w-[236px] items-center justify-center rounded-[8px] bg-[#dcc090] text-[20px] font-normal text-[#122a26] transition-colors hover:bg-[#d3b57c]"
        >
          Story Behind
        </Link>
      </div>
    </section>
  );
}
