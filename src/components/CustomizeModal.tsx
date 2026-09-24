"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import productBadge from "@/assets/icons/hero-3d-product-badge.png";

const FONTS = [
  { label: "Times New Roman", family: "'Times New Roman', Times, serif" },
  { label: "Segoe UI", family: "'Segoe UI', system-ui, sans-serif" },
  { label: "ArmAllegroU", family: "'ArmAllegroU', cursive" },
];

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 5L19 19M19 5L5 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const fontRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      setText(initial?.text ?? "");
      setFont(FONTS.find((f) => f.label === initial?.font) ?? FONTS[2]);
      setBold(initial?.bold ?? false);
      setItalic(initial?.italic ?? false);
    } else if (mounted) {
      setClosing(true);
      const timeout = setTimeout(() => {
        setMounted(false);
        setClosing(false);
      }, 200);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted]);

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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={`absolute inset-0 z-0 bg-black/60 ${
          closing ? "animate-size-modal-backdrop-out" : "animate-size-modal-backdrop-in"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 flex max-h-[85vh] w-full max-w-[24rem] flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] ${
          closing ? "animate-modal-scale-out" : "animate-modal-scale-in"
        }`}
      >
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
          <div className="relative flex items-center justify-center">
            <h2 className="text-xl font-extrabold text-[#414141]">Customization</h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-0 text-[#414141] transition-opacity hover:opacity-70"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex justify-center">
            <Image
              src={productBadge}
              alt=""
              className="h-24 w-auto object-contain"
              priority
            />
          </div>

          <div className="mt-5 flex min-h-[6.5rem] items-center justify-center rounded-2xl border-2 border-dashed border-[#122a26]/30 bg-[#122a26] px-6 py-6">
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

          <input
            type="text"
            maxLength={18}
            placeholder="custom text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-5 w-full border-0 border-b-2 border-[#dcc090] bg-transparent pb-2 text-base text-[#414141] outline-none placeholder:text-[#898989]"
          />
          <p className="mt-1 text-right text-[10px] font-medium text-[#898989]">
            {text.length}/18
          </p>

          <div ref={fontRef} className="mt-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFontOpen((o) => !o)}
                className="flex h-12 flex-1 items-center justify-between rounded-2xl border border-[#dcdcd8] bg-white px-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
              >
                <span className="text-[15px] font-medium text-[#414141]">
                  Font <span className="text-red-500">*</span>
                </span>
                <ChevronIcon
                  className={`h-4 w-4 text-[#414141] transition-transform ${fontOpen ? "rotate-180" : ""}`}
                />
              </button>

              <button
                type="button"
                aria-pressed={bold}
                aria-label="Bold"
                onClick={() => setBold((b) => !b)}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-lg font-bold shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all active:scale-95 ${
                  bold ? "border-[#122a26] bg-[#122a26]/10 text-[#122a26]" : "border-[#dcdcd8] text-[#414141]"
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
                  italic ? "border-[#122a26] bg-[#122a26]/10 text-[#122a26]" : "border-[#dcdcd8] text-[#414141]"
                }`}
              >
                I
              </button>
            </div>

            <div
              className="mt-2 h-[8.75rem] overflow-hidden rounded-2xl border border-[#dcdcd8] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-opacity"
              style={{
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
                  style={{ fontFamily: f.family }}
                  className={`block w-full px-4 py-3 text-left text-[15px] transition-colors hover:bg-[#f5f4f1] ${
                    font.label === f.label ? "bg-[#dcc090]/10 text-[#122a26]" : "text-[#414141]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-center border-t border-black/5 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              onSave({ text: text.trim(), font: font.label, bold, italic });
              onClose();
            }}
            className="flex h-11 items-center justify-center rounded-full border-2 border-[#dcc090] px-10 text-sm font-extrabold tracking-[0.14em] text-[#dcc090] uppercase shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all active:scale-95"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
