import Image from "next/image";

import heroImage from "@/assets/images/slider5.jpg";
import craftImage from "@/assets/images/description-image.png";

export default function AboutPage() {
  return (
    <main className="flex flex-col">
      <section className="relative left-1/2 h-[55vh] w-screen -mx-[50vw] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage.src})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-black/50" />
        <div className="absolute inset-x-0 top-0 flex flex-col items-center px-6 pt-8 text-center sm:pt-12">
          <h1 className="text-2xl font-extrabold tracking-[-0.01em] text-white sm:text-4xl">
            About Us
          </h1>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[48rem] flex-col gap-6 px-4 py-14 sm:px-8">
        <p className="text-[11px] font-bold tracking-wider text-[#dcc090] uppercase">
          Tradition Meets Modern Life
        </p>
        <h2 className="text-2xl leading-snug font-extrabold text-[#414141] sm:text-3xl">
          We craft leather cigarette cases for people who care about the details.
        </h2>
        <p className="text-sm leading-relaxed text-[#898989] sm:text-base">
          Smoky Concepts started with a simple idea: the accessories you carry every
          day should feel as considered as everything else in your life. Each case
          is hand-finished in genuine leather, built around a durable inner
          structure, and engraved with a shield that has come to represent our
          standard for craftsmanship.
        </p>
        <p className="text-sm leading-relaxed text-[#898989] sm:text-base">
          From our Classic line to Atelier limited pieces, every cover is designed
          to age well, hold up to daily use, and carry a little more character with
          time — natural grain, subtle color shifts, a patina that is entirely
          yours.
        </p>

        <div className="relative mt-4 h-[20rem] w-full overflow-hidden rounded-[1.5rem] shadow-[0_4px_22.5px_rgba(0,0,0,0.08)] sm:h-[24rem]">
          <Image
            src={craftImage}
            alt="Smoky Concepts craftsmanship"
            fill
            className="object-cover"
          />
        </div>

        <p className="text-sm leading-relaxed text-[#898989] sm:text-base">
          We're based in Yerevan and shipping across Armenia, with the rest of the
          world next. Thank you for being part of the ritual.
        </p>
      </div>
    </main>
  );
}
