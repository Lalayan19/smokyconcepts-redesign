import Image from "next/image";
import { useTranslations } from "next-intl";

import stepOneIcon from "@/assets/icons/howtouse1.svg";
import stepTwoIcon from "@/assets/icons/howtouse2.svg";
import stepThreeIcon from "@/assets/icons/howtouse3.svg";
import stepFourIcon from "@/assets/icons/howtouse4.svg";

// The four steps, in order (their texts are in messages/*.json, `Product`).
const STEPS = ["step1", "step2", "step3", "step4"] as const;

// One drawing per step, in order.
const ICONS = [stepOneIcon, stepTwoIcon, stepThreeIcon, stepFourIcon];

export default function HowToUse() {
  const t = useTranslations("Product");
  return (
    <section className="howto-card rounded-[1.5rem] bg-white px-6 py-10 shadow-[0_4px_22.5px_rgba(0,0,0,0.08)] sm:px-10">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold tracking-[0.05em] text-[#dcc090] uppercase sm:text-3xl">
          {t("howToUse")}
        </h2>
        <p className="mt-1 text-xs font-semibold tracking-[0.1em] text-[#dcc090]/80 uppercase">
          {t("usageInstructions")}
        </p>
      </div>

      <ol className="howto-steps mt-9 flex flex-col gap-9">
        {STEPS.map((step, index) => {
          const icon = ICONS[index];
          return (
            <li key={step} className="howto-step flex items-start gap-4">
              <div className="howto-number flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dcc090]/15 text-sm font-extrabold text-[#dcc090]">
                {index + 1}
              </div>
              {/* The title stays level with the number, as it was with the text
                  under it; the drawing is centered on the row. */}
              <div className="howto-body flex min-w-0 flex-1 items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="howto-title inline-block w-fit border-b-2 border-[#dcc090] pb-1 text-[15px] font-bold text-[#414141]">
                    {t(step)}
                  </p>
                </div>
                <span className="howto-icon relative h-12 w-12 shrink-0 self-center">
                  <Image src={icon} alt="" fill className="object-contain" />
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
