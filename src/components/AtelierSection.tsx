import Image from "next/image";
import Link from "next/link";
import type { StaticImageData } from "next/image";

type AtelierSectionProps = {
  image: StaticImageData;
  buttonHref: string;
};

export default function AtelierSection({ image, buttonHref }: AtelierSectionProps) {
  return (
    <section className="relative left-1/2 mb-3 flex h-[700px] w-screen -mx-[50vw] flex-col bg-[#efefef] px-6 pt-[48px] pb-10 text-center">
      <Link href={buttonHref}> 
      <h2
        className="font-montserrat italic text-[#414141]"
        style={{ fontWeight: 800, fontSize: "73px", lineHeight: 1.1 }}
      >
        Atelier
      </h2>
      <p
        className="mx-auto mt-3 max-w-md font-montserrat text-[#414141]"
        style={{ fontSize: "16px" }}
      >
        Pack names are standard. Dimensions aren&rsquo;t. We make precise
        versions that match yours
      </p>

      <button
        // href={buttonHref}
        style={{ letterSpacing: "0.1em" }}
        className="mt-[48px] inline-flex h-10 w-[176px] items-center justify-center self-center rounded-[8px] bg-[#dcc090] text-[20px] font-normal text-[#122a26] transition-colors hover:bg-[#d3b57c]"
      >
        Buy Now
      </button>

      <div className="relative mx-auto mt-[48px] h-[321px] w-[214px]">
        <Image src={image} alt="Atelier" fill className="object-contain" />
      </div>
      </Link>
    </section>
  );
}
