"use client";

import Image from "next/image";
import Link from "next/link";

import { BUTTON_EDGE } from "@/components/buttonEdge";
import PersonalizationScrollVideo from "@/components/PersonalizationScrollVideo";
import banner from "@/assets/images/homepage_redesign_assets/personalization_realsizes.png";
import { formatPrice } from "@/data/products";

// The page is a video that is played by scrolling, on a phone and on a tablet,
// laptop or desktop (see PersonalizationScrollVideo), then the contact form, which
// rises over the video once it has played to the end and is the end of the page (the
// footer is not shown here, see `.site-footer` in globals.css). The banner
// screen (as tall as the part of the window under the header, see `.screen-height`
// in globals.css) is not shown, and is kept here for when it comes back.

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

      {/* The video played by scrolling. It stays in place (sticky, see
          `.personalization-scrub` in globals.css) while the contact form below
          rises over it. The banner above is not shown (see
          `.personalization-banner-screen` in globals.css). */}
      <PersonalizationScrollVideo />

      {/* The contact form: a white sheet with rounded top corners that comes up
          from below the window and covers the film as the page is scrolled past
          the last frame, as tall as the window at least (see
          `.personalization-contact` in globals.css). Once it covers the film, that
          is the end of the page: there is no footer, and the way back to the shop
          is the button at the bottom of the sheet. */}
      <section className="personalization-contact font-montserrat">
        <h2 className="personalization-contact-title">Contact us</h2>
        <p className="personalization-contact-text">
          Leave your details and we will get back to you about your personalized case.
        </p>
        <form
          // There is nowhere to send it to yet: the browser checks the fields
          // and the box, and that is all.
          onSubmit={(e) => e.preventDefault()}
          className="w-full max-w-[22rem]"
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

          <label className="mt-8 flex cursor-pointer items-start gap-3 font-montserrat text-[13px] leading-snug text-black/80">
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

        {/* At the bottom of the sheet (the sheet leaves room for it under the form): a
            gray underlined link, not a button. */}
        <Link
          href="/shop"
          style={{ letterSpacing: "0.1em", fontWeight: 500 }}
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center justify-center gap-2 whitespace-nowrap px-2 py-2 font-montserrat text-[15px] text-[#898989] uppercase underline underline-offset-4 transition-colors hover:text-[#414141]"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
            <path
              d="M12 5L7 10L12 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to shop
        </Link>
      </section>
    </main>
  );
}
