"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import slider1 from "@/assets/images/slider1.jpg";
import slider2 from "@/assets/images/slider2.jpg";
import slider3 from "@/assets/images/slider3.jpg";
import slider4 from "@/assets/images/slider4.jpg";
import slider5 from "@/assets/images/slider5.jpg";
import slider6 from "@/assets/images/slider6.jpeg";

const SLIDES = [
  {
    image: slider1,
    alt: "Smoky Covers",
    title: "Smoky Covers",
    subtitle: "New Accessory for Your Ritual",
    href: "/shop",
  },
  {
    image: slider2,
    alt: "Show Your Identity",
    title: "Show Your Identity",
    subtitle: "",
    href: "/shop",
  },
  {
    image: slider3,
    alt: "Three characters, crafted for one refined ritual",
    title: "",
    subtitle: "Three characters, crafted for one refined ritual.",
    href: "/shop",
  },
  {
    image: slider4,
    alt: "Smoky Concepts",
    title: "",
    subtitle: "",
    href: "/shop",
  },
  {
    image: slider5,
    alt: "The Ritual",
    title: "The Ritual",
    subtitle: "",
    href: "/shop",
  },
  {
    image: slider6,
    alt: "Beyond the Cover",
    title: "Beyond the Cover",
    subtitle: "Leather essentials, made to belong together.",
    href: "/shop",
  },
];

const AUTOPLAY_MS = 5000;

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const start = useCallback(() => {
    stop();
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
  }, [stop]);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  const goTo = (i: number) => {
    setIndex(i);
    start();
  };

  const active = SLIDES[index];

  return (
    <section className="flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-[2.125rem] font-extrabold leading-[1.235] text-[#414141] sm:text-4xl sm:leading-tight">
          New Accessory Unlocked
        </h2>
        <p className="max-w-[52rem] text-[15px] leading-[1.375] text-[#414141] sm:text-base sm:leading-relaxed">
          Unique <strong className="font-bold">accessories</strong> that
          redefine your <strong className="font-bold">rituals</strong>.
        </p>
      </div>

      <div
        className="relative isolate overflow-hidden rounded-[1.5rem] bg-black sm:rounded-[2.25rem]"
        onMouseEnter={stop}
        onMouseLeave={start}
      >
        <div className="relative h-[28rem] touch-pan-y overscroll-none sm:h-[32rem]">
          <div
            className="relative z-0 flex h-full bg-black transition-transform duration-500 ease-in-out"
            style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
          >
            {SLIDES.map((slide, i) => (
              <div
                key={i}
                className="relative h-full w-full min-w-full shrink-0 overflow-hidden bg-black"
              >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1280px) 1200px, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-0 z-[2] bg-linear-to-t from-black/55 via-black/20 to-transparent" />

          <div className="pointer-events-none absolute bottom-10 left-7 z-[3] max-w-[22.625rem] text-white sm:bottom-12 sm:left-12 sm:max-w-[33rem]">
            {active.title && (
              <h3 className="text-4xl font-extrabold leading-none sm:text-5xl">
                {active.title}
              </h3>
            )}
            {active.subtitle && (
              <p className="mt-3 text-sm font-medium leading-[1.57] sm:mt-4 sm:text-lg sm:leading-relaxed">
                {active.subtitle}
              </p>
            )}
            <Link
              href={active.href}
              className="pointer-events-auto mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-[#dcc090] px-5 text-[1.125rem] leading-none font-medium tracking-[0.05em] text-[#122a26] uppercase transition-colors hover:bg-[#d3b57c] sm:mt-7 sm:min-h-11 sm:px-7 sm:text-sm sm:font-extrabold sm:tracking-[0.2em]"
            >
              Shop
            </Link>
          </div>

          <div className="absolute bottom-5 left-1/2 z-[3] flex -translate-x-1/2 gap-2 sm:bottom-4">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-4 bg-white"
                    : "w-3 bg-white/60 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
