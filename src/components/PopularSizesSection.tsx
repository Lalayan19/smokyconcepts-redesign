"use client";

import { BUTTON_EDGE } from "@/components/buttonEdge";
import PopularSizesSlider from "@/components/PopularSizesSlider";

type PopularSizesSectionProps = {
  onButtonClick: () => void;
};

export default function PopularSizesSection({ onButtonClick }: PopularSizesSectionProps) {
  return (
    // A tap anywhere in the section opens the picker, same as the button
    // (the button's click bubbles up here; it stays a real button for keyboard
    // users). A sideways drag of the row of packs isn't a click.
    <section
      onClick={onButtonClick}
      className="popular-sizes-section relative left-1/2 cursor-pointer rounded-t-[1.5rem] w-screen -mx-[50vw] h-[70vh] overflow-hidden bg-white px-6 pt-12 pb-10 text-center [-webkit-tap-highlight-color:transparent]"
    >
      <h2
        className="font-montserrat italic text-[#000000] "
        style={{ fontWeight: 690, fontSize: "32px", lineHeight: 1.1 }}
      >
        Popular Sizes
      </h2>
      <p
        className="mx-auto max-w-md font-montserrat text-[#000000]"
        style={{ fontWeight: 500, fontSize: "13px" }}
      >
        Pack names are standard. Dimensions aren&rsquo;t. We make precise
        versions that match yours
      </p>

      <button
        type="button"
        style={{fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", ...BUTTON_EDGE }}
        className="popular-sizes-button mt-[49px] inline-flex h-[42px] w-[228px] items-center justify-center self-center rounded-[8px] bg-[#dcc090] text-[15px] font-montserrat text-[#122a26] transition-colors hover:bg-[#d3b57c]"
      >
        Select Cigarette
      </button>

      {/* The row of packs (its distance from the button is set in globals.css);
          the packs and their names slide in a loop. */}
      <div className="popular-sizes-strip relative -mx-6">
        <PopularSizesSlider />
      </div>
    </section>
  );
}
