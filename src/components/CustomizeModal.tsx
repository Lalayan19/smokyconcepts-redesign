"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";

import caseIcon from "@/assets/icons/case.svg";
import { useSwipeSheet } from "@/hooks/useSwipeSheet";

const FONTS = [
  { label: "Times New Roman", family: "'Times New Roman', Times, serif" },
  { label: "Segoe UI", family: "'Segoe UI', system-ui, sans-serif" },
  { label: "ArmAllegroU", family: "'ArmAllegroU', cursive" },
];
// The font a customization starts with when it has none saved: ArmAllegroU.
const DEFAULT_FONT_INDEX = 2;

const fontIndexFor = (label: string | undefined) => {
  const index = FONTS.findIndex((f) => f.label === label);
  return index === -1 ? DEFAULT_FONT_INDEX : index;
};

// Which font is chosen, and the one that is on its way out if it just changed
// (the same way the Ultra Slims name on the home page changes).
type FontNav = {
  current: number;
  previous: number | null;
  // How many times the font has changed; used to restart the animation.
  changes: number;
  // Which way the arrow went: 1 for the next font (the new name comes in from
  // the right), -1 for the one before.
  direction: 1 | -1;
};

const startFontNav = (label: string | undefined): FontNav => ({
  current: fontIndexFor(label),
  previous: null,
  changes: 0,
  direction: 1,
});

function ArrowIcon({ className, direction }: { className?: string; direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d={direction === "left" ? "M12 5L7 10L12 15" : "M8 5L13 10L8 15"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type Customization = {
  text: string;
  font: string;
  bold: boolean;
  italic: boolean;
};

type CustomizeModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: Customization) => void;
  initial: Customization | null;
};

export default function CustomizeModal({
  open,
  onClose,
  onSave,
  initial,
}: CustomizeModalProps) {
  const t = useTranslations("Product");
  const [text, setText] = useState(initial?.text ?? "");
  const [fontNav, setFontNav] = useState(() => startFontNav(initial?.font));
  const [bold, setBold] = useState(initial?.bold ?? false);
  const [italic, setItalic] = useState(initial?.italic ?? false);
  const font = FONTS[fontNav.current];
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

  // The arrows go round: after the last font comes the first, and the other way.
  const stepFont = (direction: 1 | -1) =>
    setFontNav((s) => ({
      current: (s.current + direction + FONTS.length) % FONTS.length,
      previous: s.current,
      changes: s.changes + 1,
      direction,
    }));

  useEffect(() => {
    if (open) {
      setText(initial?.text ?? "");
      setFontNav(startFontNav(initial?.font));
      setBold(initial?.bold ?? false);
      setItalic(initial?.italic ?? false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4 sm:pt-20">
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
        style={sheetStyle}
        className={`relative z-10 sheet-height flex w-full max-w-[40rem] flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-[0_-20px_60px_rgba(0,0,0,0.25)] sm:rounded-[1.75rem] sm:shadow-[0_20px_60px_rgba(0,0,0,0.25)] ${modalAnimation}`}
      >
        {/* Closes the modal: at the top right, on a laptop and desktop only (a phone
            pulls the sheet down by its handle, a tablet taps outside). */}
        <button
          type="button"
          aria-label="Close"
          onClick={requestClose}
          className="customize-close absolute top-1.5 right-3 z-20 hidden h-9 w-9 items-center justify-center rounded-full text-[#9d9d9d] transition-colors hover:bg-black/5 hover:text-[#414141]"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
          </svg>
        </button>
        <div {...handleProps} className="sheet-handle flex shrink-0 touch-none justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-black/20" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={contentRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-4 pb-5 sm:px-12 sm:pt-4"
        >
          <p className="text-[11px] font-bold tracking-[0.14em] text-[#898989] uppercase">
            {t("livePreview")}
          </p>
          {/* The case: a gold drawing on the sheet itself, 457 x 194 in its own
              units, as wide as the fields below (at most 450px). Everything is
              sized from --case, its width, so it scales as one piece. Only the
              top of the case (its frame) takes room in the layout: the rest of
              the drawing runs down behind the fields (they have a white
              background), and only the ends of its legs show between them. */}
          <div
            className="mt-6"
            style={
              {
                containerType: "inline-size",
                "--case": "min(100cqw, 450px)",
              } as React.CSSProperties
            }
          >
            <div
              className="relative mx-auto"
              // The outer frame ends 118.8 / 457 of the width down.
              style={{ width: "var(--case)", height: "calc(var(--case) * 0.26 + 34px)" }}
            >
              <div
                className="absolute"
                style={{ left: 0, top: 0, width: "100%", aspectRatio: "457 / 194", pointerEvents: "none" }}
              >
                <Image
                  src={caseIcon}
                  alt=""
                  fill
                  loading="eager"
                  sizes="450px"
                  className="object-contain"
                />
                {/* The text panel covers the inner frame (the outer edge of its
                    line: x 11.1 to 445.3, y 11.1 to 107.1 of the drawing, corners 14). */}
                <div
                  className="absolute flex items-center justify-center"
                  style={{
                    left: "2.436%",
                    top: "5.738%",
                    width: "95.003%",
                    height: "49.493%",
                    padding: "0 calc(var(--case) * 0.03)",
                    borderRadius: "calc(var(--case) * 0.0306)",
                    backgroundColor: "#122a26",
                  }}
                >
                  <p
                    className="max-w-full truncate text-center text-white"
                    style={{
                      fontSize: "calc(var(--case) * 0.094)",
                      fontFamily: font.family,
                      fontWeight: bold ? 700 : 400,
                      fontStyle: italic ? "italic" : "normal",
                    }}
                  >
                    {text.trim() || t("yourText")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-4 bg-white">
            <label className="text-[11px] font-bold tracking-[0.14em] text-[#898989] uppercase">
              {t("customText")}
            </label>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#dcdcd8] bg-white px-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-colors focus-within:border-[#dcc090]">
              <input
                type="text"
                maxLength={18}
                placeholder={t("textPlaceholder")}
                value={text}
                onChange={(e) => setText(e.target.value)}
                // 16px, not smaller: an iPhone zooms the whole page in when a
                // field under 16px gets focus, and does not always zoom back out.
                style={{ fontSize: 16 }}
                className="h-12 flex-1 border-0 bg-transparent text-[#414141] outline-none placeholder:text-[#b3b3b3]"
              />
              <span className="shrink-0 text-[11px] font-medium text-[#b3b3b3]">
                {text.length}/18
              </span>
            </div>
          </div>

          <div className="relative mt-4 bg-white">
            <label className="text-[11px] font-bold tracking-[0.14em] text-[#898989] uppercase">
              {t("style")}
            </label>
            <div className="mt-2 flex items-center gap-2">
              {/* The font: an arrow on each side and its name between them. When
                  it changes, the old name leaves the way the arrow points and the
                  new one comes in from the other side, as the Ultra Slims name
                  does on the home page. */}
              <div
                role="group"
                aria-label="Font"
                className="flex h-12 min-w-0 flex-1 items-center rounded-2xl border border-[#dcdcd8] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-colors hover:border-[#dcc090]"
              >
                <button
                  type="button"
                  aria-label="Previous font"
                  onClick={() => stepFont(-1)}
                  className="flex h-full w-10 shrink-0 items-center justify-center rounded-l-2xl text-[#414141] transition-all hover:text-[#a9752e] active:scale-90"
                >
                  <ArrowIcon direction="left" className="h-5 w-5" />
                </button>
                <div
                  className="relative h-full min-w-0 flex-1 overflow-hidden text-[15px] font-medium text-[#414141]"
                  style={{ lineHeight: "46px" }}
                >
                  {fontNav.previous !== null && (
                    <span
                      key={`out-${fontNav.changes}`}
                      aria-hidden="true"
                      className="product-name-out absolute inset-0 truncate px-1 text-center"
                      style={
                        {
                          "--name-shift": `${fontNav.direction * 50}%`,
                          fontFamily: FONTS[fontNav.previous].family,
                        } as CSSProperties
                      }
                      onAnimationEnd={() =>
                        setFontNav((s) =>
                          s.changes === fontNav.changes ? { ...s, previous: null } : s,
                        )
                      }
                    >
                      {FONTS[fontNav.previous].label}
                    </span>
                  )}
                  <span
                    key={`in-${fontNav.changes}`}
                    aria-live="polite"
                    className={`absolute inset-0 truncate px-1 text-center ${
                      fontNav.changes > 0 ? "product-name-in" : ""
                    }`}
                    style={
                      {
                        "--name-shift": `${fontNav.direction * 50}%`,
                        fontFamily: font.family,
                      } as CSSProperties
                    }
                  >
                    {font.label}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Next font"
                  onClick={() => stepFont(1)}
                  className="flex h-full w-10 shrink-0 items-center justify-center rounded-r-2xl text-[#414141] transition-all hover:text-[#a9752e] active:scale-90"
                >
                  <ArrowIcon direction="right" className="h-5 w-5" />
                </button>
              </div>

              <button
                type="button"
                aria-pressed={bold}
                aria-label="Bold"
                onClick={() => setBold((b) => !b)}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-lg font-bold shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all active:scale-95 ${
                  bold
                    ? "border-[#dcc090] bg-[#dcc090]/15 text-[#a9752e]"
                    : "border-[#dcdcd8] text-[#414141] hover:border-[#dcc090]"
                }`}
              >
                B
              </button>
              <button
                type="button"
                aria-pressed={italic}
                aria-label="Italic"
                onClick={() => setItalic((i) => !i)}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-lg italic shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all active:scale-95 ${
                  italic
                    ? "border-[#dcc090] bg-[#dcc090]/15 text-[#a9752e]"
                    : "border-[#dcdcd8] text-[#414141] hover:border-[#dcc090]"
                }`}
              >
                I
              </button>
            </div>
          </div>
        </div>

        {/* Same room under the button as under the Apply button in the size sheet. */}
        <div className="shrink-0 border-t border-black/5 px-6 pb-10 pt-4 sm:px-12">
          <button
            type="button"
            onClick={() => {
              onSave({ text: text.trim(), font: font.label, bold, italic });
              requestClose();
            }}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#dcc090] text-sm font-extrabold tracking-[0.14em] text-[#122a26] uppercase shadow-[0_4px_16px_rgba(220,192,144,0.4)] transition-all hover:bg-[#d3b57c] active:scale-[0.98]"
          >
            {t("saveCustomization")}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
