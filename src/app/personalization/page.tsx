"use client";

import Image from "next/image";

import { BUTTON_EDGE } from "@/components/buttonEdge";
import PersonalizationScrollVideo from "@/components/PersonalizationScrollVideo";
import banner from "@/assets/images/homepage_redesign_assets/personalization_realsizes.png";
import { formatPrice } from "@/data/products";

// The page is two screens, each as tall as the part of the window under the
// header (see `.screen-height` in globals.css): the banner, then the form. Both
// are black, so the page is one black field with no edge between them.
// For now the page is only a video that is played by scrolling, on a phone and
// on a tablet, laptop or desktop (see PersonalizationScrollVideo); the two
// screens below (the banner and the form) are not shown, and are kept here for
// when they come back.

const FIELDS = [
  { name: "name", label: "Name", type: "text", autoComplete: "name" },
  { name: "phone", label: "Phone Number", type: "tel", autoComplete: "tel" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
];

const MIN_COST = 100000;

export default function PersonalizationPage() {
  return (
    <main className="personalization-page bg-black">
      {/* Screen 1: the picture sits at the bottom of the screen from edge to edge
          (whole, never cropped), and the title is in the middle of the space
          above it. The picture has no background of its own, so it sits on the
          black with no edge. */}
      <section className="personalization-banner-screen screen-height flex flex-col overflow-hidden bg-black">
        <div className="flex min-h-[110px] flex-1 items-center justify-center px-6 text-center">
          <h1
            className="personalization-title font-montserrat italic text-white"
            style={{ fontWeight: 700, fontSize: "36px", lineHeight: 1.1 }}
          >
            Personalization
          </h1>
        </div>
        {/* On a wide screen the picture stops growing at 560px and is centered. */}
        <div className="relative mx-auto w-full shrink-0" style={{ maxWidth: 560 }}>
          <Image
            src={banner}
            alt="A black leather case with the word Personalized in gold on its lid"
            priority
            sizes="(min-width: 561px) 560px, 100vw"
            className="block h-auto w-full"
          />
        </div>
      </section>

      {/* The video played by scrolling. For now it is the only thing on the page:
          the banner above and the form below are not shown (see
          `.personalization-banner-screen` and `.personalization-form-screen` in
          globals.css). */}
      <PersonalizationScrollVideo />

      {/* Screen 2: the form, 55% of a screen tall (see `.screen-form` in
          globals.css), or as tall as the form needs on a screen too short for
          that. The form sits at the top, and the black under it is the room the
          footer's rounded corners slide up over (the last 1.5rem, see
          `.personalization-page` in globals.css). */}
      <section className="personalization-form-screen screen-form flex items-start justify-center bg-black px-8 pb-6">
        <form
          // There is nowhere to send it to yet: the browser checks the fields
          // and the box, and that is all.
          onSubmit={(e) => e.preventDefault()}
          className="w-full max-w-[22rem] pt-2 pb-4"
        >
          {/* The name of each field sits on its line (see `.float-field` in
              globals.css) and moves up above it when the field is used, so the
              fields are only 33px tall and 20px apart. */}
          <div className="flex flex-col gap-5">
            {FIELDS.map((field) => (
              <div key={field.name} className="float-field font-montserrat">
                <input
                  id={`personalization-${field.name}`}
                  required
                  name={field.name}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  placeholder=" "
                  // 16px, not smaller: an iPhone zooms the whole page in when a
                  // field under 16px gets focus.
                  style={{ fontSize: 16 }}
                />
                <label htmlFor={`personalization-${field.name}`}>{field.label}*</label>
              </div>
            ))}
          </div>

          <label className="mt-8 flex cursor-pointer items-start gap-3 font-montserrat text-[13px] leading-snug text-white/80">
            <input
              required
              type="checkbox"
              name="agree"
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer"
              style={{ accentColor: "#dcc090" }}
            />
            <span>I agree that the cost can start from {formatPrice(MIN_COST)}</span>
          </label>

          <button
            type="submit"
            style={{ letterSpacing: "0.1em", fontWeight: 500, ...BUTTON_EDGE }}
            className="mx-auto mt-10 flex h-[42px] w-[228px] items-center justify-center rounded-[8px] bg-[#dcc090] font-montserrat text-[20px] text-[#122a26] uppercase transition-colors hover:bg-[#d3b57c]"
          >
            Submit
          </button>
        </form>
      </section>
    </main>
  );
}
