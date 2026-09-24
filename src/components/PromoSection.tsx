import Link from "next/link";
import type { StaticImageData } from "next/image";

type PromoSectionProps = {
  title: string;
  desktopImage: StaticImageData;
  mobileImage: StaticImageData;
  primaryHref: string;
  primaryLabel?: string;
  secondaryHref: string;
  secondaryLabel?: string;
};

export default function PromoSection({
  title,
  desktopImage,
  mobileImage,
  primaryHref,
  primaryLabel = "Buy",
  secondaryHref,
  secondaryLabel = "Details",
}: PromoSectionProps) {
  return (
    <section className="relative left-1/2 h-screen w-screen -mx-[50vw] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat sm:hidden"
        style={{ backgroundImage: `url(${mobileImage.src})` }}
      />
      <div
        className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat sm:block"
        style={{ backgroundImage: `url(${desktopImage.src})` }}
      />

      <div className="absolute inset-0 bg-black/30" />

      <div className="absolute inset-0 flex flex-col items-center px-4 pt-16 text-center sm:items-end sm:px-12 sm:pt-20 sm:text-right md:px-20 xl:px-[120px]">
        <h2 className="text-5xl font-extrabold tracking-[0.05em] text-white uppercase sm:text-6xl md:text-7xl">
          {title}
        </h2>

        <div className="flex flex-1 flex-col items-center justify-center pb-16 sm:items-end sm:justify-center sm:pb-0">
          <div className="flex flex-row gap-4">
            <Link
              href={secondaryHref}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#dcc090] px-7 text-sm font-extrabold tracking-[0.2em] text-[#dcc090] uppercase transition-colors hover:bg-[#dcc090]/10"
            >
              {secondaryLabel}
            </Link>
            <Link
              href={primaryHref}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#dcc090] px-7 text-sm font-extrabold tracking-[0.2em] text-[#122a26] uppercase transition-colors hover:bg-[#d3b57c]"
            >
              {primaryLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
