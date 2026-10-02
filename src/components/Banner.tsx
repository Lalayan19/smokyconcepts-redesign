import Link from "next/link";
import type { ReactNode } from "react";
import type { StaticImageData } from "next/image";

type BannerProps = {
  title: ReactNode;
  image: StaticImageData;
  buttonLabel: string;
  buttonHref?: string;
  onButtonClick?: () => void;
};

export default function Banner({
  title,
  image,
  buttonLabel,
  buttonHref,
  onButtonClick,
}: BannerProps) {
  const buttonClassName =
    "inline-flex h-9 w-[178.25px] items-center justify-center rounded-full bg-[#dcc090] text-xs font-extrabold tracking-[0.14em] text-[#122a26] transition-colors hover:bg-[#d3b57c] sm:text-sm";

  return (
    <section className="relative left-1/2 mb-3 h-[70vh] w-screen -mx-[50vw] overflow-hidden bg-black">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${image.src})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/0 to-black/60" />

      <div className="absolute inset-x-0 top-0 flex justify-center px-6 pt-[42px] text-center sm:pt-[58px]">
        <h2 className="text-2xl font-extrabold tracking-[-0.01em] text-white sm:text-4xl">
          {title}
        </h2>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex justify-center px-6 pb-[42px] text-center sm:pb-[58px]">
        {onButtonClick ? (
          <button type="button" onClick={onButtonClick} className={buttonClassName}>
            {buttonLabel}
          </button>
        ) : (
          <Link href={buttonHref ?? "/shop"} className={buttonClassName}>
            {buttonLabel}
          </Link>
        )}
      </div>
    </section>
  );
}
