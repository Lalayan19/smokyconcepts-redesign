"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import productBadge from "@/assets/icons/hero-3d-product-badge.png";
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
  const fontRef = useRef<HTMLDivElement>(null);
  const {
    mounted,
    sheetRef,
    contentRef,
    sheetStyle,
    backdropClassName,
    handleProps,
    contentDragProps,
    requestClose,
  } = useSwipeSheet({ open, onClose });

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
        setFontOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        className="relative z-10 flex max-h-[85vh] w-full max-w-[24rem] flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-[0_-20px_60px_rgba(0,0,0,0.25)] sm:rounded-[1.75rem] sm:shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
      >
        <div {...handleProps} className="flex shrink-0 touch-none justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-black/20" />
        </div>
        <div {...contentDragProps} className="flex min-h-0 flex-1 flex-col">
        <div ref={contentRef} className="flex-1 touch-none overflow-y-auto px-6 pb-5">
          <h2 className="text-center text-xl font-extrabold tracking-[-0.01em] text-[#414141]">
            Customization
          </h2>

          <div className="mt-4 flex justify-center rounded-[1.25rem] bg-[#f5f4f1] py-4">
            <Image
              src={productBadge}
              alt=""
              className="h-20 w-auto object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.18)]"
              priority
            />
          </div>

          <p className="mt-4 text-[11px] font-bold tracking-[0.14em] text-[#898989] uppercase">
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
                onClick={() => setFontOpen((o) => !o)}
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
                    setFontOpen(false);
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
        </div>

        <div className="shrink-0 border-t border-black/5 px-6 py-3">
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
