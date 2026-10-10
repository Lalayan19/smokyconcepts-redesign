import { BUTTON_EDGE } from "@/components/buttonEdge";

// "Say Hi", the small section at the end of the home page, above the footer: the
// texts of the one on smokyconcepts.com (in Montserrat, black), a little smaller,
// on white, and a button like the other buttons of the home page. The button does
// not go anywhere yet.
export default function SayHiSection() {
  return (
    <section className="say-hi-section w-full bg-white font-montserrat">
      {/* The bottom 1.5rem of the padding is behind the footer (see `.site-footer`
          in globals.css), so its rounded corners show white. */}
      <div className="mx-auto flex max-w-[120rem] flex-col items-center gap-6 px-5 pb-[5.5rem] pt-[100px] sm:px-8 sm:pb-[6.5rem] lg:px-[7.5rem]">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-[1.875rem] font-extrabold leading-[1.235] text-black sm:text-[2rem] sm:leading-tight">
            Say Hi
          </h2>
          <p className="max-w-[52rem] text-[0.9375rem] font-medium leading-[1.375] text-black sm:leading-relaxed">
            Have a question, an idea, or a collaboration in mind?
          </p>
        </div>

        <button
          type="button"
          style={{ fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", ...BUTTON_EDGE }}
          className="inline-flex h-[42px] w-[200px] items-center justify-center rounded-[8px] bg-[#dcc090] text-[15px] text-[#122a26] transition-colors hover:bg-[#d3b57c]"
        >
          Reach Out
        </button>
      </div>
    </section>
  );
}
