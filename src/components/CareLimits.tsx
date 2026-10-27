import Image from "next/image";
import { useTranslations } from "next-intl";

import { forUppercase } from "@/lib/armenianCaps";

import temperatureIcon from "@/assets/icons/01.svg";
import sunlightIcon from "@/assets/icons/02.svg";
import moistureIcon from "@/assets/icons/03.svg";
import cleanersIcon from "@/assets/icons/04.svg";
import patinaIcon from "@/assets/icons/05.svg";
import lockIcon from "@/assets/icons/06.svg";

// The six rules of the care card, in order (their texts are in messages/*.json, `Care`).
const STEPS = [
  { key: "temperature", icon: temperatureIcon },
  { key: "sunlight", icon: sunlightIcon },
  { key: "moisture", icon: moistureIcon },
  { key: "cleaners", icon: cleanersIcon },
  { key: "patina", icon: patinaIcon },
  { key: "lock", icon: lockIcon },
] as const;

// "Care & Limits": a white card laid out like How to Use (the number, the rule underlined in
// gold, its drawing at the right); on a tablet and larger the six are in two rows of three, each
// a big drawing with its rule under it (see `.care-*` in globals.css). The heading and the rules are
// the same size, weight and colour as How to Use's (gold; dark grey #414141). The drawings are
// smaller than How to Use's (34.6px here on a phone, 48px there) and are made for a dark
// card (white lines, with dark parts that disappear into it), so on this white card they are inverted
// (`invert`): black lines, and the parts that were dark become white. They are 30% lighter than
// black (`opacity-70` on the white card: #4d4d4d).
export default function CareLimits() {
  const t = useTranslations("Care");
  return (
    <section className="care-card rounded-[1.5rem] bg-white px-6 py-10 shadow-[0_4px_22.5px_rgba(0,0,0,0.08)] sm:px-10">
      <div className="text-center">
        <h2 className="text-[22px] font-extrabold tracking-[0.05em] text-[#dcc090] uppercase sm:text-[28px]">
          {forUppercase(t("title"))}
        </h2>
      </div>

      <ol className="care-steps mt-9 flex flex-col gap-9">
        {STEPS.map(({ key, icon }, index) => (
          <li key={key} className="care-step flex items-start gap-4">
            <div className="care-number flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dcc090]/15 text-sm font-extrabold text-[#dcc090]">
              {index + 1}
            </div>
            <div className="care-body flex min-w-0 flex-1 items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="care-title inline-block w-fit border-b-2 border-[#dcc090] pb-1 text-[14px] font-bold text-[#414141]">
                  {/* <nowrap> in a text keeps what is inside it in one row (the temperatures). */}
                  {t.rich(key, {
                    nowrap: (chunks) => <span className="whitespace-nowrap">{chunks}</span>,
                  })}
                </p>
              </div>
              <span className="care-icon relative h-[34.6px] w-[34.6px] shrink-0 self-center">
                <Image src={icon} alt="" fill className="object-contain opacity-70 invert" />
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
