"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2 6h11v9H2V6ZM13 10h4l4 3.5V15h-8v-5ZM6 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ROW = {
  title: "Shipping Details",
  // The whole text, in the popup.
  subtitle:
    "Shipping time depends on the model you choose. In-stock items ship within 2–3 business days. Made-to-order pieces are hand-assembled after your order is placed, with delivery in 5–10 business days. Currently delivering within Yerevan — expanding soon to the rest of Armenia and worldwide.",
  // What the card says, with "more", which opens the popup.
  short: "In-stock items ship within 2–3 business days; made-to-order pieces in 5–10.",
};

// How long the popup takes to go away (ms): the length of `animate-modal-scale-out`.
const CLOSE_MS = 200;

const MORE_CLASS =
  "font-bold text-[#122a26] underline underline-offset-2 hover:text-[#dcc090]";

export default function DeliveryInfo() {
  // "more" opens the whole text in a popup. The popup is not in the middle of the
  // screen: it opens in the card's own place (the same width, from the card's top,
  // as tall as its text needs), over the card and what is under it, with the rest of
  // the page dimmed. It scrolls with the card, so it stays where the card is.
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const show = () => {
    window.clearTimeout(closeTimer.current);
    setClosing(false);
    setOpen(true);
  };

  const hide = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
      moreRef.current?.focus({ preventScroll: true });
    }, CLOSE_MS);
  }, []);

  // Escape closes it; the keyboard goes to it when it opens.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, hide]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  return (
    <section className="delivery-card relative mt-5 rounded-[1.5rem] bg-white p-5 shadow-[0_4px_22.5px_rgba(0,0,0,0.08)]">
      <h2 className="text-[11px] font-bold tracking-wider text-[#898989] uppercase">
        Delivery &amp; Availability
      </h2>

      <div className="mt-1 flex flex-col divide-y divide-black/5">
        <div className="flex items-start gap-4 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#122a26]/[0.07]">
            <TruckIcon className="h-6 w-6 text-[#122a26]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#414141]">{ROW.title}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-[#898989]">
              {ROW.short}{" "}
              <button
                ref={moreRef}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={show}
                className={MORE_CLASS}
              >
                more
              </button>
            </p>
          </div>
        </div>
      </div>

      {open && (
        <>
          {/* The rest of the page, dimmed; a tap on it closes the popup. */}
          <button
            type="button"
            aria-label="Close"
            onClick={hide}
            className={`fixed inset-0 z-40 cursor-default bg-black/40 ${
              closing ? "animate-size-modal-backdrop-out" : "animate-size-modal-backdrop-in"
            }`}
          />

          {/* The popup: the card's own place, the card's own look, with the whole
              text. */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delivery-popup-title"
            className={`absolute inset-x-0 top-0 z-50 origin-top rounded-[1.5rem] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)] ${
              closing ? "animate-modal-scale-out" : "animate-modal-scale-in"
            }`}
          >
            <h2
              id="delivery-popup-title"
              className="text-[11px] font-bold tracking-wider text-[#898989] uppercase"
            >
              Delivery &amp; Availability
            </h2>

            <div className="mt-1 flex items-start gap-4 py-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#122a26]/[0.07]">
                <TruckIcon className="h-6 w-6 text-[#122a26]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#414141]">{ROW.title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-[#898989]">
                  {ROW.subtitle}
                </p>
              </div>
            </div>

            <button
              ref={closeRef}
              type="button"
              onClick={hide}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#dcc090] text-sm font-extrabold tracking-[0.14em] text-[#122a26] uppercase transition-colors hover:bg-[#d3b57c]"
            >
              Close
            </button>
          </div>
        </>
      )}
    </section>
  );
}
