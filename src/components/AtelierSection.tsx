import Image from "next/image";
import Link from "next/link";
import type { StaticImageData } from "next/image";

type AtelierSectionProps = {
  image: StaticImageData;
  buttonHref: string;
};

export default function AtelierSection({ image, buttonHref }: AtelierSectionProps) {
  return (
    <section className="bg-white relative left-1/2 flex h-[94vh] w-screen -mx-[50vw] flex-col bg-[#efefef] px-6 pt-[70px] pb-10 text-center">
      <Link href={buttonHref}>
        <h2
          className="font-montserrat italic text-[#130F0F]"
          style={{ fontWeight: 800, fontSize: "66px", lineHeight: 1.1 }}
        >
          Atelier
        </h2>
        <p
          className="mx-auto max-w-md font-montserrat text-[#120F0F]"
          style={{ fontSize: "14px", fontWeight: "600" }}
        >
          Pack names are standard. Dimensions aren&rsquo;t. We make precise
          versions that match yours
        </p>

        <button
          // href={buttonHref}
          style={{
            letterSpacing: "0.1em",
            border: "1px solid #122A26",
            fontWeight: 500,
          }}
          className="mt-[48px] inline-flex h-[42px] w-[165px] items-center justify-center self-center rounded-[8px] bg-[#dcc090] text-[17px] font-montserrat text-[#122a26] transition-colors hover:bg-[#d3b57c]"
        >
          BUY NOW
        </button>

        <div className="relative mx-auto mt-[54px] h-[315px] w-[203px]">
          <Image src={image} alt="Atelier" fill className="object-contain" />
        </div>
      </Link>
    </section>
  );
}
