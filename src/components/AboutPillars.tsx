"use client";

import Image from "next/image";
import type { StaticImageData } from "next/image";
import { useCallback, useRef, useState, type ReactNode } from "react";

import engineering from "@/assets/images/aboytpage/engineering.avif";
import firstConcept from "@/assets/images/aboytpage/first-concept.avif";
import mission from "@/assets/images/aboytpage/mission.avif";

// The three cards of the About page (The First Concept, The Mission, When
// Engineering Meets Craft). On a phone they are a row you swipe, one card nearly
// the width of the screen, with a dot under it for each card; from `sm` they are
// all in view, in a grid.

type Pillar = {
  id: string;
  // The card's colour (the whole class, so Tailwind sees it).
  bg: string;
  image: StaticImageData;
  alt: string;
  // The two pictures with a white background are blended into the card's colour.
  blend: boolean;
  title: ReactNode;
  body: ReactNode[];
};

const PILLARS: Pillar[] = [
  {
    id: "first-concept",
    bg: "bg-[#dcc090]",
    image: firstConcept,
    alt: "A young plant emerging from soil — the first concept",
    blend: true,
    title: "The First Concept",
    body: [
      <>
        Every strong system starts with a clear idea.
        <br />
        Ours began with a ritual:
        <br />
        the objects people return to — again and again — without thinking, yet never without
        meaning.
      </>,
      <>
        We call it <strong className="font-black">Covering.</strong>
      </>,
      <>
        Our first expression is <strong className="font-black">Smoky Covers.</strong>
      </>,
      <>Covers for cigarette packs — the center of the ritual.</>,
      <>Extended to the objects that move with you — money, documents, cards, and beyond.</>,
      <>
        These are objects you live with.
        <br />
        They should feel right.
        <br />
        They should hold their place.
        <br />
        Covering is where we began.
        <br />
        It is only the beginning.
      </>,
    ],
  },
  {
    id: "mission",
    bg: "bg-[#95c48a]",
    image: mission,
    alt: "A floating mountain — the mission",
    blend: true,
    title: "The Mission",
    body: [
      <>
        We work with rituals and the culture around them — bringing clarity, care, and
        <br />
        meaning to what people return to.
      </>,
      <>Our first mission begins within smoking culture.</>,
      <>Not only for the one holding it, but for everyone around them.</>,
      <>We protect you and those close to you from visual noise and what’s behind it.</>,
      <>This approach does not stay in one place.</>,
      <>
        Wherever rituals exist, we look for what’s missing — and introduce clarity, beauty, and
        meaning.
      </>,
    ],
  },
  {
    id: "engineering",
    bg: "bg-[#cbcbcb]",
    image: engineering,
    alt: "A precision 3D printer — engineering meets craft",
    blend: false,
    title: (
      <>
        When Engineering
        <br />
        Meets Craft
      </>
    ),
    body: [
      <>We grow objects layer by layer, with precision.</>,
      <>Structure takes form — controlled, exact, uncompromised.</>,
      <>Solutions from the nature, applied through technology, expand what’s possible.</>,
      <>In the hands of the creator, it becomes a new brush.</>,
      <>
        Advanced materials like PETG carbon fiber bring the accuracy required — enabling
        <br />
        forms beyond the limits of traditional manufacturing.
      </>,
      <>The result is composed — balanced, intentional, complete.</>,
      <>Technology gives us freedom.</>,
      <>Craft gives it soul.</>,
    ],
  },
];

function PillarCard({ pillar, className = "" }: { pillar: Pillar; className?: string }) {
  return (
    <article
      className={`relative flex h-full flex-col pt-[88px] lg:pt-[72px] xl:pt-[80px] ${className}`}
    >
      <div
        className={`relative flex min-h-[600px] flex-1 flex-col rounded-[30px] pl-5 pr-7 pb-6 sm:min-h-[620px] sm:px-6 lg:min-h-[500px] lg:px-6 xl:min-h-[595px] xl:w-[392px] xl:rounded-[36px] xl:px-7 ${pillar.bg} pt-5 sm:pt-7 lg:pt-5 xl:pt-6`}
      >
        <div className="pointer-events-none -mt-16 flex h-[212px] shrink-0 items-end justify-center px-1 sm:-mt-20 sm:h-[228px] lg:-mt-14 lg:h-[236px] xl:-mt-16 xl:h-[244px] mb-2.5 sm:mb-3 lg:mb-2.5 xl:mb-3">
          <div className="relative h-full w-full max-w-[min(100%,432px)] xl:max-w-[min(100%,388px)] -translate-y-4 sm:-translate-y-5 lg:-translate-y-5 xl:-translate-y-6">
            <Image
              src={pillar.image}
              alt={pillar.alt}
              fill
              sizes="(min-width: 1280px) 388px, (min-width: 1024px) 30vw, 92vw"
              className={
                pillar.blend
                  ? "object-contain object-bottom mix-blend-multiply"
                  : "object-contain object-bottom"
              }
            />
          </div>
        </div>
        <h3 className="shrink-0 text-center font-extrabold leading-tight tracking-[-0.02em] text-[#122a26] xl:leading-[1.08] text-[23px] sm:text-[24px] lg:text-[25px] xl:text-[28px]">
          {pillar.title}
        </h3>
        <div className="flex-1 break-words font-bold tracking-[-0.01em] text-[#122a26] lg:mt-2.5 lg:space-y-[9px] xl:mt-3 mt-2 space-y-[11px] text-[13px] sm:text-[13px] leading-[1.38] xl:space-y-[11px] xl:text-[13px] xl:leading-[18px]">
          {pillar.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function AboutPillars() {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // A dot: scroll its card to the left edge (16px in, the scroller's padding).
  const goTo = useCallback((index: number) => {
    const scroller = scrollerRef.current;
    const card = cardRefs.current[index];
    if (!scroller || !card) return;
    scroller.scrollTo({ left: card.offsetLeft - 16, behavior: "smooth" });
    setActive(index);
  }, []);

  // Scrolling: the dot of the card nearest the middle of the row is the lit one.
  const onScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const middle = scroller.scrollLeft + scroller.clientWidth / 2;
    let nearest = 0;
    let nearestDistance = Infinity;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const distance = Math.abs(card.offsetLeft + card.clientWidth / 2 - middle);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = i;
      }
    });
    if (nearest !== active) setActive(nearest);
  }, [active]);

  return (
    <section className="mt-16 lg:mt-[92px] xl:mt-[120px]">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="-mx-4 snap-x snap-mandatory overflow-x-auto overflow-y-visible overscroll-x-contain px-4 pb-1 sm:hidden [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex gap-6">
          {PILLARS.map((pillar, i) => (
            <div
              key={pillar.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="w-[82vw] min-w-[82vw] shrink-0 snap-center last:mr-3"
            >
              <PillarCard pillar={pillar} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 sm:hidden">
        {PILLARS.map((pillar, i) => (
          <button
            key={pillar.id}
            type="button"
            onClick={() => goTo(i)}
            className={`h-[4px] w-[44px] rounded-full transition-colors ${
              i === active ? "bg-[#122a26]" : "bg-[#cbcbcb]"
            }`}
            aria-label={`Go to ${pillar.id}`}
          />
        ))}
      </div>

      <div className="hidden sm:grid sm:grid-cols-2 sm:items-stretch sm:gap-8 lg:grid-cols-3 lg:gap-8 xl:grid-cols-[repeat(3,max-content)] xl:items-start xl:justify-center xl:gap-12">
        {PILLARS.map((pillar) => (
          <PillarCard key={pillar.id} pillar={pillar} className="min-h-0" />
        ))}
      </div>
    </section>
  );
}
