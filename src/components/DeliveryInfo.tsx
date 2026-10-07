"use client";

import { useEffect, useState } from "react";

import { useSwipeSheet } from "@/hooks/useSwipeSheet";

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

const ROWS = [
  {
    icon: TruckIcon,
    title: "Shipping Details",
    subtitle:
      "Shipping time depends on the model you choose. In-stock items ship within 2–3 business days. Made-to-order pieces are hand-assembled after your order is placed, with delivery in 5–10 business days. Currently delivering within Yerevan — expanding soon to the rest of Armenia and worldwide.",
    // What the card says on a tablet and larger, where "more" opens the whole text.
    short: "In-stock items ship within 2–3 business days; made-to-order pieces in 5–10.",
  },
];

// The whole text of the delivery card, in a sheet (a dialog on a larger screen).
function DeliveryModal({
  open,
  onClose,
  title,
  text,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  text: string;
}) {
  const {
    mounted,
    sheetRef,
    contentRef,
    sheetStyle,
    modalAnimation,
    backdropClassName,
    handleProps,
    requestClose,
  } = useSwipeSheet({ open, onClose });

  useEffect(() => {
    if (!mounted) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center text-left sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={requestClose}
        className={`absolute inset-0 z-0 bg-black/60 ${backdropClassName}`}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-modal-title"
        style={sheetStyle}
        className={`relative z-10 flex max-h-[86dvh] w-full max-w-[34rem] flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-[0_-20px_60px_rgba(0,0,0,0.25)] sm:rounded-[1.75rem] sm:shadow-[0_20px_60px_rgba(0,0,0,0.25)] ${modalAnimation}`}
      >
        <div {...handleProps} className="sheet-handle flex shrink-0 touch-none justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-black/15" />
        </div>

        <div
          ref={contentRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-2 pb-8 sm:px-10 sm:pb-10"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#122a26]/[0.07]">
              <TruckIcon className="h-6 w-6 text-[#122a26]" />
            </div>
            <h2 id="delivery-modal-title" className="text-xl font-extrabold text-[#414141]">
              {title}
            </h2>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-[#898989]">{text}</p>

          <button
            type="button"
            onClick={requestClose}
            className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#dcc090] text-sm font-extrabold tracking-[0.14em] text-[#122a26] uppercase transition-colors hover:bg-[#d3b57c]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryInfo() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="delivery-card mt-5 rounded-[1.5rem] bg-white p-5 shadow-[0_4px_22.5px_rgba(0,0,0,0.08)]">
      <h2 className="text-[11px] font-bold tracking-wider text-[#898989] uppercase">
        Delivery &amp; Availability
      </h2>

      <div className="mt-1 flex flex-col divide-y divide-black/5">
        {ROWS.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.title} className="flex items-start gap-4 py-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#122a26]/[0.07]">
                <Icon className="h-6 w-6 text-[#122a26]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#414141]">{row.title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-[#898989]">
                  {/* The whole text on a phone; on a tablet and larger (see
                      `.delivery-full` and `.delivery-short` in globals.css) a short
                      one with "more", which opens the whole text. */}
                  <span className="delivery-full">{row.subtitle}</span>
                  <span className="delivery-short hidden">
                    {row.short}{" "}
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className="font-bold text-[#122a26] underline underline-offset-2 hover:text-[#dcc090]"
                    >
                      more
                    </button>
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <DeliveryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={ROWS[0].title}
        text={ROWS[0].subtitle}
      />
    </section>
  );
}
