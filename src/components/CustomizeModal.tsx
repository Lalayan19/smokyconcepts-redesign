"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useSwipeSheet } from "@/hooks/useSwipeSheet";

const FONTS = [
  { label: "Times New Roman", family: "'Times New Roman', Times, serif" },
  { label: "Segoe UI", family: "'Segoe UI', system-ui, sans-serif" },
  { label: "ArmAllegroU", family: "'ArmAllegroU', cursive" },
];

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 8.5L10 11.5L13 8.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 10.5l3.5 3.5L16 5.5"
        stroke="currentColor"
        strokeWidth="2"
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
  const [text, setText] = useState(initial?.text ?? "");
  const [font, setFont] = useState(
    FONTS.find((f) => f.label === initial?.font) ?? FONTS[2],
  );
  const [bold, setBold] = useState(initial?.bold ?? false);
  const [italic, setItalic] = useState(initial?.italic ?? false);
  const [fontOpen, setFontOpen] = useState(false);
  // Blank room added under the form while the font list is open, so there is
  // always enough to scroll for the list to be brought up into view.
  const [listSpace, setListSpace] = useState(0);
  const fontRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const spaceTimer = useRef<number | undefined>(undefined);
  const scrollBackTo = useRef(0);
  const fontOpenRef = useRef(false);
  // Whichever way the sheet closes (drag, backdrop, Save), the font list goes
  // back to closed so it isn't left open the next time the modal appears.
  const handleClose = useCallback(() => {
    window.clearTimeout(spaceTimer.current);
    fontOpenRef.current = false;
    setFontOpen(false);
    setListSpace(0);
    onClose();
  }, [onClose]);
  const {
    mounted,
    sheetRef,
    contentRef,
    sheetStyle,
    backdropClassName,
    handleProps,
    requestClose,
  } = useSwipeSheet({ open, onClose: handleClose });

  // Opening the list scrolls the modal down so the list sits right under the
  // Style row; closing it (or picking a font) scrolls back to where it was.
  const openFontList = useCallback(() => {
    const scroller = contentRef.current;
    const row = fontRef.current;
    const spacer = spacerRef.current;
    if (!scroller || !row || !spacer) return;
    window.clearTimeout(spaceTimer.current);
    fontOpenRef.current = true;
    setFontOpen(true);

    scrollBackTo.current = scroller.scrollTop;
    const scrollerTop = scroller.getBoundingClientRect().top;
    const target = Math.max(
      0,
      scroller.scrollTop + row.getBoundingClientRect().top - scrollerTop - 8,
    );
    // Where the form ends (the spacer sits right after it) plus bottom padding.
    const contentHeight =
      scroller.scrollTop +
      spacer.getBoundingClientRect().top -
      scrollerTop +
      parseFloat(getComputedStyle(scroller).paddingBottom);
    setListSpace(Math.max(0, target + scroller.clientHeight - contentHeight));
    // A moment later, once the extra room has been laid out, bring the list up.
    window.setTimeout(() => scroller.scrollTo({ top: target, behavior: "smooth" }), 30);
  }, [contentRef]);

  const closeFontList = useCallback(() => {
    if (!fontOpenRef.current) return;
    fontOpenRef.current = false;
    setFontOpen(false);
    contentRef.current?.scrollTo({ top: scrollBackTo.current, behavior: "smooth" });
    // Keep the extra room until the scroll back has played out.
    window.clearTimeout(spaceTimer.current);
    spaceTimer.current = window.setTimeout(() => setListSpace(0), 450);
  }, [contentRef]);

  useEffect(() => {
    if (open) {
      setText(initial?.text ?? "");
      setFont(FONTS.find((f) => f.label === initial?.font) ?? FONTS[2]);
      setBold(initial?.bold ?? false);
      setItalic(initial?.italic ?? false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fontRef.current && !fontRef.current.contains(event.target as Node)) {
        closeFontList();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.clearTimeout(spaceTimer.current);
    };
  }, [closeFontList]);

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
        className="relative z-10 sheet-height flex w-full max-w-[40rem] flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-[0_-20px_60px_rgba(0,0,0,0.25)] sm:rounded-[1.75rem] sm:shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
      >
        <div {...handleProps} className="flex shrink-0 touch-none justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-black/20" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={contentRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-1 pb-5 sm:px-12 sm:pt-4"
        >
          <p className="text-[11px] font-bold tracking-[0.14em] text-[#898989] uppercase">
            Live Preview
          </p>
          <div className="mt-2 flex min-h-[5rem] items-center justify-center rounded-[1.25rem] border border-[#dcc090]/40 bg-gradient-to-b from-[#173934] to-[#0e211e] px-6 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(18,42,38,0.25)]">
            <p
              className="max-w-full truncate text-center text-2xl text-white"
              style={{
                fontFamily: font.family,
                fontWeight: bold ? 700 : 400,
                fontStyle: italic ? "italic" : "normal",
              }}
            >
              {text.trim() || "Your Text"}
            </p>
          </div>

          <div className="mt-4">
            <label className="text-[11px] font-bold tracking-[0.14em] text-[#898989] uppercase">
              Custom Text
            </label>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#dcdcd8] bg-white px-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-colors focus-within:border-[#dcc090]">
              <input
                type="text"
                maxLength={18}
                placeholder="Type something special…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="h-12 flex-1 border-0 bg-transparent text-[15px] text-[#414141] outline-none placeholder:text-[#b3b3b3]"
              />
              <span className="shrink-0 text-[11px] font-medium text-[#b3b3b3]">
                {text.length}/18
              </span>
            </div>
          </div>

          <div ref={fontRef} className="relative mt-4">
            <label className="text-[11px] font-bold tracking-[0.14em] text-[#898989] uppercase">
              Style
            </label>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => (fontOpen ? closeFontList() : openFontList())}
                className="flex h-12 flex-1 items-center justify-between rounded-2xl border border-[#dcdcd8] bg-white px-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-colors hover:border-[#dcc090]"
              >
                <span
                  className="truncate text-[15px] font-medium text-[#414141]"
                  style={{ fontFamily: font.family }}
                >
                  {font.label}
                </span>
                <ChevronIcon
                  className={`h-4 w-4 shrink-0 text-[#414141] transition-transform ${fontOpen ? "rotate-180" : ""}`}
                />
              </button>

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

            <div
              className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-[#dcdcd8] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all"
              style={{
                maxHeight: fontOpen ? "10rem" : 0,
                opacity: fontOpen ? 1 : 0,
                pointerEvents: fontOpen ? "auto" : "none",
              }}
              aria-hidden={!fontOpen}
            >
              {FONTS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  tabIndex={fontOpen ? 0 : -1}
                  onClick={() => {
                    setFont(f);
                    closeFontList();
                  }}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-[15px] transition-colors hover:bg-[#f5f4f1] ${
                    font.label === f.label ? "bg-[#dcc090]/10 text-[#a9752e]" : "text-[#414141]"
                  }`}
                >
                  <span style={{ fontFamily: f.family }}>{f.label}</span>
                  {font.label === f.label && <CheckIcon className="h-4 w-4 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
          <div ref={spacerRef} aria-hidden="true" style={{ height: listSpace }} />
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
            Save Customization
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
