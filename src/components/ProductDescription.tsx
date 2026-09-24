import Image from "next/image";

import descriptionImage from "@/assets/images/description-image.png";

export default function ProductDescription() {
  return (
    <section className="mt-10">
      <h2 className="text-[1.375rem] font-extrabold tracking-[-0.01em] text-[#414141]">
        Product Story
      </h2>

      <div className="relative mt-5 min-h-[36rem] overflow-hidden rounded-[1.5rem] shadow-[0_4px_22.5px_rgba(0,0,0,0.08)] sm:min-h-[40rem]">
        <Image
          src={descriptionImage}
          alt="Classic Brown leather cigarette case"
          fill
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/55 to-black/90" />

        <div className="relative z-10 flex flex-col gap-4 px-5 pt-72 pb-8 sm:px-8 sm:pt-80 sm:pb-10">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-[#dcc090] uppercase">
              Classic Brown
            </p>
            <p className="mt-1 text-xl leading-snug font-extrabold text-white">
              Warm, familiar, and easy to live with.
            </p>
          </div>

          <p className="text-sm leading-relaxed text-white/85">
            Its rich brown leather gives the piece a grounded, timeless look, while
            the reinforced material Carbon Fiber structure adds everyday durability
            and a clean, dependable form.
          </p>

          <p className="text-sm leading-relaxed text-white/85">
            Simple, solid, and made to age well.
          </p>

          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 backdrop-blur-sm">
            <p className="text-xs leading-relaxed text-white/75">
              <span className="font-bold text-white">Note:</span> Natural leather
              may vary slightly in grain, texture, and color tone. Each piece is
              unique and may differ slightly from the photos shown.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
