"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { StaticImageData } from "next/image";

type PopularSizesSectionProps = {
  image: StaticImageData;
  onButtonClick: () => void;
};

export default function PopularSizesSection({ image, onButtonClick }: PopularSizesSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);

  return (
    // A tap anywhere in the section opens the picker, same as the button
    // (the button's click bubbles up here; it stays a real button for keyboard
    // users). A sideways drag to scroll the image strip isn't a click.
    <section
      onClick={onButtonClick}
      className="relative left-1/2 cursor-pointer rounded-t-[1.5rem] w-screen -mx-[50vw] h-[70vh] overflow-hidden bg-white px-6 pt-12 pb-10 text-center [-webkit-tap-highlight-color:transparent]"
    >
      <h2
        className="font-montserrat italic text-[#130F0F] "
        style={{ fontWeight: 600, fontSize: "32px", lineHeight: 1.1 }}
      >
        Popular Sizes
      </h2>
      <p
        className="mx-auto max-w-md font-montserrat text-[#130F0F]"
        style={{ fontWeight: 500, fontSize: "13px" }}
      >
        Pack names are standard. Dimensions aren&rsquo;t. We make precise
        versions that match yours
      </p>

      <button
        type="button"
        style={{fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}
        className="mt-[49px] inline-flex h-[42px] w-[228px] items-center justify-center self-center rounded-[8px] bg-[#dcc090] text-[15px] font-montserrat text-[#122a26] transition-colors hover:bg-[#d3b57c]"
      >
        Select Cigarette
      </button>

      <div
        ref={scrollRef}
        className="scrollbar-hide relative mt-[49px] -mx-6 overflow-x-auto px-6"
      >
        <Image
          src={image}
          alt="Popular Sizes"
          className="mt-[12px] h-[190px] w-auto max-w-none"
        />
      </div>
    </section>
  );
}
