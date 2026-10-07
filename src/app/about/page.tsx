import Image from "next/image";
import Link from "next/link";

import AboutPillars from "@/components/AboutPillars";

import banner1 from "@/assets/images/aboytpage/banner-1.avif";
import banner2 from "@/assets/images/aboytpage/banner-2.avif";
import banner3 from "@/assets/images/aboytpage/banner-3.avif";
import iconAlways from "@/assets/images/aboytpage/icon-always.svg";
import iconExpanding from "@/assets/images/aboytpage/icon-expanding.svg";
import iconNext from "@/assets/images/aboytpage/icon-next.svg";
import iconNow from "@/assets/images/aboytpage/icon-now.svg";
import shield1 from "@/assets/images/aboytpage/shield-1.svg";
import shield2 from "@/assets/images/aboytpage/shield-2.svg";
import shield3 from "@/assets/images/aboytpage/shield-3.svg";

// The three pictures of the top: which side of the page each one is on gives it
// its rounded corners, and `position` is the part of the picture that is kept
// when it is cropped.
const BANNERS = [
  {
    src: banner1,
    alt: "Premium leather rolls in earthy tones",
    wrapper: "rounded-l-[30px] rounded-r-none",
    image: "object-cover scale-x-[-1]",
  },
  {
    src: banner2,
    alt: "Studio precision tooling",
    wrapper: "rounded-none",
    image: "object-cover object-[70%_center]",
  },
  {
    src: banner3,
    alt: "Smoky Concepts artisan workshop",
    wrapper: "rounded-r-[30px] rounded-l-none lg:rounded-r-[12px]",
    image: "object-cover object-[42%_center]",
  },
];

// The Mark: the three parts of the logo.
const MARK = [
  {
    icon: shield1,
    name: " Shield ",
    line: "Care. Protection",
    text: "Care and protection come from the same place. The form is a shield — because protection is not added. It is built into the structure.",
  },
  {
    icon: shield2,
    name: " S + C ",
    line: "The identity within",
    text: "Smoky Concepts lives inside the shield. Our ideas carry meaning — and stand protected.",
  },
  {
    icon: shield3,
    name: " Crown ",
    line: "Power. Standard. Identity",
    text: "At the top — a crown. A mark of authority and identity. Not claimed. Built in. It holds another meaning. The battlements exist to protect the crown. Everything is intentional. Nothing exists without purpose.",
  },
];

// What Comes Next: the four cards.
const NEXT = [
  {
    bg: "bg-[#414141]",
    icon: iconNow,
    title: "NOW",
    text: "Smoky Covers: The ritual that started everything.",
  },
  {
    bg: "bg-[#b79c75]",
    icon: iconExpanding,
    title: "EXPANDING",
    text: "The Covers Line — money, documents, cards, laptops — wherever the first concept leads.",
  },
  {
    bg: "bg-[#2a574f]",
    icon: iconNext,
    title: "NEXT",
    text: "New Concepts. Different ideas. Different worlds. The same DNA.",
  },
  {
    bg: "bg-[#122a26]",
    icon: iconAlways,
    title: "ALWAYS",
    text: "One Approach. If it is not extraordinary, it is not ready.",
  },
];

export default function AboutPage() {
  return (
    <main className="flex-1 w-full max-w-full overflow-x-hidden">
      <div className="about-page bg-[#efefef] font-montserrat text-[#414141]">
        <div className="mx-auto w-full max-w-[1680px] px-4 sm:px-8 lg:px-[72px]">
          <h1 className="pt-10 text-center text-[26px] font-extrabold text-[#414141] md:pt-12 md:text-[36px]">
            About
          </h1>

          {/* The three pictures and the first text. */}
          <section className="mx-auto mt-8 grid max-w-[1460px] grid-cols-1 gap-4 lg:mt-[56px] lg:grid-cols-2 lg:gap-1.5 xl:gap-2.5 lg:h-[500px]">
            <div className="grid grid-cols-3 gap-2 lg:gap-[9px]">
              {BANNERS.map((banner) => (
                <div
                  key={banner.alt}
                  className={`relative h-[420px] overflow-hidden sm:h-[420px] lg:h-[500px] ${banner.wrapper}`}
                >
                  <Image
                    src={banner.src}
                    alt={banner.alt}
                    fill
                    preload
                    sizes="(min-width: 1024px) 272px, 33vw"
                    className={banner.image}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col rounded-[12px] bg-white p-5 sm:p-8 lg:rounded-[12px_28px_28px_12px] lg:p-[38px]">
              <h2 className="text-[22px] font-extrabold leading-tight text-[#414141] sm:text-[28px] lg:text-[30px]">
                We build objects with a reason to exist.
              </h2>
              <div className="mt-3 space-y-2.5 text-[13px] font-semibold leading-[21px] text-[#414141] sm:text-[15px] lg:mt-4 lg:space-y-3 lg:text-[15px] lg:leading-[22px] lg:font-medium">
                <p>
                  Smoky Concepts is a premium accessories brand shaped by intention, precision,
                  and material honesty. We work with leather, carbon fiber, natural wood, gold
                  and silver hardware — and anything else the concept demands. There is no fixed
                  palette. There is only the right choice.
                </p>
                <p>We don’t create to fill categories. We create to define them.</p>
                <p>
                  Every object begins with a single question: what should it feel like in the
                  hand, how should it be carried, what should it say without words?
                </p>
                <p>The answer defines everything — form, material, balance, weight, and presence.</p>
                <p>We build with clarity. We release with purpose.</p>
              </div>
            </div>
          </section>

          {/* Smoky. Concepts. Two words. One intention */}
          <section className="mx-auto mt-14 max-w-[500px] text-center text-[#414141] lg:mt-[96px] lg:max-w-[1360px]">
            <h2 className="text-center text-[26px] font-black leading-[1.15] sm:text-[30px] lg:text-[34px]">
              <span className="lg:hidden">
                Smoky. Concepts. Two
                <br />
                words. One intention
              </span>
              <span className="hidden lg:inline">Smoky. Concepts. Two words. One intention</span>
            </h2>
            <p className="mt-7 text-center text-[13px] font-bold leading-[22px] sm:text-[14px] lg:mt-[22px] lg:text-[15px] lg:font-semibold lg:leading-[24px]">
              <span className="font-extrabold">Smoky</span>
              <span> — because not everything begins visible.</span>
            </p>
            <p className="mx-auto mt-2 max-w-[470px] whitespace-pre-line text-center text-[13px] font-bold leading-[1.42] sm:text-[14px] lg:max-w-[1300px] lg:text-[15px] lg:font-semibold lg:leading-[24px]">
              {`An idea, before it becomes real, exists the way smoke does: present, shapeable,
impossible to ignore — but not yet solid. That
tension is where we live. Between the invisible and the held. Between what exists in the mind and what the hand
can finally touch.`}
            </p>
            <p className="mt-8 text-center text-[13px] font-bold leading-[22px] sm:text-[14px] lg:mt-[30px] lg:text-[15px] lg:font-semibold lg:leading-[24px]">
              <span className="font-extrabold">Concepts</span>
              <span> — because we don’t start with products.</span>
            </p>
            <p className="mx-auto mt-2 max-w-[470px] text-center text-[13px] font-bold leading-[1.42] sm:text-[14px] lg:max-w-[980px] lg:text-[15px] lg:font-semibold lg:leading-[24px]">
              We start with questions. A concept is an idea with enough clarity to become something
              real.
              <br />
              When it’s ready — truly ready — We build it, release it, and stand behind it
              completely.
              <br />
              The name is not aesthetic. It is a process. Smoky Concepts is what happens when an
              idea stops
              <br />
              being invisible.
            </p>
          </section>

          {/* The First Concept, The Mission, When Engineering Meets Craft */}
          <AboutPillars />

          {/* The Mark */}
          <section className="mx-auto mt-16 max-w-[1500px] text-center text-[#414141] lg:mt-[110px]">
            <h2 className="text-[22px] font-extrabold sm:text-[26px] lg:text-[30px]">The Mark</h2>
            <p className="mt-2 text-[13px] font-bold leading-[22px] sm:text-[15px] lg:text-[15px] lg:font-semibold lg:leading-[23px]">
              Look at our logo and you will see everything we are.
            </p>
            <div className="mt-7 h-px w-full bg-[#cbcbcb] lg:mt-7" />
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-8 lg:grid-cols-3 lg:gap-6">
              {MARK.map((part) => (
                <article
                  key={part.line}
                  className="flex flex-col items-center text-center text-[#414141]"
                >
                  <div className="relative h-[116px] w-[108px] lg:h-[128px] lg:w-[118px]">
                    <Image src={part.icon} alt="" fill className="object-contain" />
                  </div>
                  <p className="mt-4 text-[26px] font-extrabold leading-[1.1] sm:text-[30px] lg:text-[36px]">
                    <span className="font-medium">[</span>
                    <span>{part.name}</span>
                    <span className="font-medium">]</span>
                  </p>
                  <p className="text-[20px] font-extrabold leading-[1.1] sm:text-[22px] lg:text-[27px]">
                    {part.line}
                  </p>
                  <p className="mt-4 max-w-[380px] text-[13px] font-bold leading-[22px] sm:text-[14px] lg:text-[15px] lg:font-semibold lg:leading-[23px]">
                    {part.text}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* What Comes Next */}
          <section className="mt-16 text-[#414141] lg:mt-[110px]">
            <div className="mx-auto max-w-[1260px] text-left lg:text-center">
              <h2 className="text-left text-[22px] font-extrabold tracking-[-0.02em] sm:text-[24px] lg:text-[30px] lg:text-center">
                What Comes Next
              </h2>
              <div className="mt-3 flex max-w-[1180px] flex-col gap-px text-left text-[12px] font-bold leading-[19px] tracking-[-0.01em] sm:mt-5 sm:gap-1 sm:text-[14px] sm:leading-[20px] lg:mx-auto lg:mt-6 lg:gap-1 lg:text-center lg:text-[15px] lg:font-semibold lg:leading-[22px]">
                <p className="m-0">
                  Covering was the proof. The concept is limitless. We started with a simple idea —
                  take something used every day, and make it extraordinary.
                </p>
                <p className="m-0">
                  Smoky Covers exist. They are held. They are lived with. The concept is real. But
                  Smoky Concepts was never about covering alone.
                </p>
                <p className="m-0">
                  It is about bringing concepts to life. Covering is the first expression. What
                  follows is different in form — but identical in standard, material, and intent.
                  We don’t ask what category comes next. We ask: what idea is ready to become
                  something real? The answer changes. The approach does not.
                </p>
              </div>
            </div>
            <div className="mx-auto mt-6 grid max-w-[1260px] grid-cols-2 gap-3 sm:mt-7 sm:gap-4 lg:mt-9 lg:grid-cols-4 lg:gap-6">
              {NEXT.map((card) => (
                <article
                  key={card.title}
                  className={`relative ${card.bg} flex h-[182px] flex-col justify-end rounded-[18px] p-3 text-white sm:h-[298px] sm:rounded-[30px] sm:p-5 lg:h-[344px] lg:rounded-[34px] lg:p-6`}
                >
                  <div className="absolute right-3 top-3 h-[34px] w-[34px] sm:right-5 sm:top-5 sm:h-[110px] sm:w-[110px] lg:h-[133px] lg:w-[133px]">
                    <Image src={card.icon} alt="" fill className="object-contain" />
                  </div>
                  <p className="text-[22px] font-extrabold tracking-[0.08em] sm:text-[18px] lg:text-[21px]">
                    {card.title}
                  </p>
                  <p className="mt-1 max-w-[150px] text-[11px] font-semibold leading-[15px] sm:mt-1.5 sm:max-w-[280px] sm:text-[14px] sm:leading-[19px] lg:text-[16px] lg:leading-[22px]">
                    {card.text}
                  </p>
                </article>
              ))}
            </div>
            <div className="mx-auto mt-6 max-w-[1260px] space-y-1 text-left text-[12px] font-bold leading-[20px] sm:mt-7 sm:space-y-1.5 sm:text-[15px] sm:leading-[23px] lg:mt-8 lg:text-center lg:text-[15px] lg:font-semibold lg:leading-[23px]">
              <p>We build with patience. We release when the concept is complete.</p>
              <p>Every object we bring into the world is one we would carry ourselves.</p>
            </div>
          </section>

          {/* House of Khanos */}
          <section className="mx-auto mt-14 max-w-[1040px] text-center text-[#414141] lg:mt-[110px]">
            <h2 className="text-[26px] font-black tracking-[-0.02em] sm:text-[28px] lg:text-[30px]">
              House of Khanos
            </h2>
            <div className="mx-auto mt-5 max-w-[460px] space-y-1 text-[13px] font-bold leading-[1.34] tracking-[-0.01em] sm:max-w-[980px] sm:text-[14px] sm:leading-[22px] lg:mt-7 lg:text-[15px] lg:font-semibold lg:leading-[23px]">
              <p>
                A house for ideas — brought to life across different worlds. Each brand stands on
                its own.
              </p>
              <p>Defined by its identity, its mission, its purpose.</p>
              <p>Smoky Concepts is the first expression.</p>
              <p>This is the beginning.</p>
            </div>
          </section>

          {/* Now You Know */}
          <section className="mx-auto mt-20 grid max-w-[980px] grid-cols-1 gap-4 pb-16 text-[#414141] lg:mt-[118px] lg:grid-cols-[320px_1fr] lg:items-start lg:gap-[28px] lg:pb-[92px]">
            <h2 className="text-center text-[42px] font-black leading-[0.92] tracking-[-0.025em] sm:text-[46px] lg:text-left lg:text-[68px] lg:font-extrabold">
              <span className="whitespace-nowrap lg:hidden">Now You Know</span>
              <span className="hidden lg:inline">
                Now You
                <br />
                Know
              </span>
            </h2>
            <div className="flex max-w-[520px] flex-col items-center gap-5 text-center lg:items-start lg:gap-6 lg:text-left">
              <div className="max-w-[420px] space-y-1.5 text-[14px] font-bold leading-[1.45] tracking-[-0.01em] sm:text-[15px] sm:leading-[23px] lg:max-w-[520px] lg:text-[18px] lg:font-semibold lg:leading-[30px]">
                <p>
                  What you carry speaks for you. What you
                  <br className="sm:hidden" /> keep defines you. Make both worth it.
                </p>
                <p>
                  Welcome to Smoky Concepts.
                  <br className="sm:hidden" />{" "}
                  <span className="whitespace-nowrap">We Bring Concepts to Life.</span>
                </p>
              </div>
              <Link
                href="/shop"
                className="mx-auto inline-flex h-[42px] w-full max-w-[286px] items-center justify-center whitespace-nowrap rounded-[10px] bg-[#dcc090] px-5 font-bold tracking-[0.1em] text-[#122a26] transition-opacity hover:opacity-90 lg:mx-0 lg:h-11 lg:max-w-[372px] lg:font-semibold text-[14px] sm:text-[14px] lg:text-[20px]"
              >
                SEE WHAT WE’VE BUILT
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
