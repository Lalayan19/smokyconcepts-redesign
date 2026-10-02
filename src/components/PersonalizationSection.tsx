import Link from "next/link";
import Image from "next/image";
import type { StaticImageData } from "next/image";

type PersonalizationSectionProps = {
  image: StaticImageData;
  buttonHref: string;
};

export default function PersonalizationSection({
  image,
  buttonHref,
}: PersonalizationSectionProps) {
  return (
    <section className="relative left-1/2 -mt-6 flex h-[90vh] w-screen -mx-[50vw] flex-col overflow-hidden rounded-[1.5rem] bg-black px-6 pt-12 text-center">
      <h2
        className="font-montserrat italic text-white"
        style={{ fontWeight: 700, fontSize: "40px", lineHeight: 1.1 }}
      >
        Personalization
      </h2>
      <p
        className="mx-auto mt-1 max-w-md font-montserrat text-white/80"
        style={{ fontSize: "16px" }}
      >
        <strong className="font-bold text-white">Compatible</strong> Most of
        Ultra Slims sizes
      </p>

      <Link
        href={buttonHref}
        style={{ letterSpacing: "0.1em" }}
        className="mt-[22px] inline-flex h-10 w-[230px] items-center justify-center self-center rounded-[8px] bg-[#dcc090] text-[20px] font-normal text-[#122a26] transition-colors hover:bg-[#d3b57c]"
      >
        Personalize
      </Link>

      <div className="relative mt-8 flex-1">
        <Image src={image} alt="Personalization" fill className="object-contain object-top" />
      </div>
    </section>
  );
}
