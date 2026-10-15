"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import cigaretteIcon from "@/assets/images/cigarete-icon.svg";
import {
  BRAND_IMAGES,
  BRANDS,
  findByAlias,
  type Brand,
  type BrandProduct,
} from "@/data/cigaretteBrands";
import { useSwipeSheet } from "@/hooks/useSwipeSheet";

// What is chosen at the end: the cigarette, its brand, and the size it is in.
export type SelectedProduct = { brand: string; name: string; category: string };

type BrandSelectorModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: (item: SelectedProduct) => void;
};

const normalize = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");

// The brand whose whole name is what is typed, or what the typed text starts with (a
// space after the name: "marlboro gold" is Marlboro). Of two that fit ("Black" and "Black
// Tip" for "black tip"), the one with the longer name. The text is already normalized.
function brandNamedIn(text: string): Brand | null {
  if (!text) return null;
  let found: Brand | null = null;
  for (const b of BRANDS) {
    if (text === b.key || text.startsWith(b.key + " ")) {
      if (!found || b.key.length > found.key.length) found = b;
    }
  }
  return found;
}

// A row of the list is always 72px tall (56px for the picture), with the keyboard up
// or not. The label over the list is 28px.
const ROW_HEIGHT = 72;
const LABEL_H = 28;

// The height of a phone's sheet: 69% of the screen when the keyboard is not up (it
// starts about a third of the way down), and when the keyboard takes the bottom of
// the screen, the part that is in view less 4.5rem: the site's header is 4rem tall,
// fixed to the top of the screen and over everything, so the sheet stops 0.5rem
// under it and never goes up behind it. (`100%` is the part of the screen that is in
// view, over the keyboard: the sheet's parent is as tall as that; `dvh` does not
// shrink when the keyboard comes up.) With 412px in view over the keyboard there is
// room for the field, the label and three whole rows; with less, the third is cut.
const SHEET_HEIGHT = "min(69dvh, calc(100% - 4.5rem))";

// A laptop and larger (the same screens as the "laptop and up" rules in globals.css).
const DESKTOP_QUERY = "(min-width: 1024px) and (min-height: 500px)";
function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const getDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;
const getServerDesktop = () => false;
function useDesktop() {
  return useSyncExternalStore(subscribeDesktop, getDesktop, getServerDesktop);
}

// Keeps what is tapped from taking the focus off the search field, so the keyboard
// stays where it is.
const keepFocus = (e: React.MouseEvent) => e.preventDefault();

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The search field. It is not an `<input>` but a line of editable text: a phone's
// browser puts its bar of saved passwords, cards and addresses (the key, card and
// pin above the keyboard) over the keyboard for every text input, whatever
// `autocomplete` says, and it has nothing to offer for a box that is not a form
// field. It is typed in, pasted into, and tapped like an input, and it is only ever
// one line of plain text.
function SearchField({
  fieldRef,
  value,
  onChange,
  onEnter,
  onFocusChange,
}: {
  fieldRef: React.RefObject<HTMLDivElement | null>;
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  onFocusChange: (focused: boolean) => void;
}) {
  // What is shown follows `value` when it is changed from outside (a brand was
  // chosen, the field was cleared); what is typed is already in the box.
  useEffect(() => {
    const field = fieldRef.current;
    if (!field || field.textContent === value) return;
    field.textContent = value;
    if (document.activeElement === field) {
      const range = document.createRange();
      range.selectNodeContents(field);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [fieldRef, value]);

  // The Enter key of a phone's keyboard does not always come as a key press, but
  // always as a new line being typed (which is stopped: it is one line).
  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const onBeforeInput = (e: InputEvent) => {
      if (e.inputType === "insertParagraph" || e.inputType === "insertLineBreak") {
        e.preventDefault();
        onEnter();
      } else if (e.inputType === "insertFromDrop") {
        e.preventDefault();
      }
    };
    field.addEventListener("beforeinput", onBeforeInput);
    return () => field.removeEventListener("beforeinput", onBeforeInput);
  }, [fieldRef, onEnter]);

  return (
    <div
      ref={fieldRef}
      role="searchbox"
      aria-label="Search brands"
      aria-multiline="false"
      contentEditable
      suppressContentEditableWarning
      data-placeholder="Search brands"
      inputMode="search"
      enterKeyHint="search"
      autoCorrect="off"
      autoCapitalize="none"
      spellCheck={false}
      onFocus={() => onFocusChange(true)}
      onBlur={() => onFocusChange(false)}
      onInput={(e) => {
        const field = e.currentTarget;
        // An emptied box can keep a stray line break, which would hide the
        // placeholder.
        if (!field.textContent) field.innerHTML = "";
        onChange(field.textContent ?? "");
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter();
        }
      }}
      onPaste={(e) => {
        // Only the text of what is pasted, on one line.
        e.preventDefault();
        const pasted = e.clipboardData.getData("text/plain").replace(/\s+/g, " ");
        document.execCommand("insertText", false, pasted);
      }}
      // 16px, not smaller: an iPhone zooms the whole page in when a field under
      // 16px gets focus, and does not always zoom back out.
      style={{ fontSize: 16 }}
      className="brand-search-field block h-12 w-full cursor-text overflow-hidden rounded-full border border-black/10 bg-white pr-11 pl-11 leading-[46px] font-medium whitespace-nowrap text-[#414141] outline-none focus-visible:border-[#dcc090] focus-visible:ring-2 focus-visible:ring-[#dcc090]/40 [-webkit-user-select:text] [user-select:text]"
    />
  );
}

// The square picture (with a little rounding) at the left of a row: the brand's
// picture, and for now (and for a cigarette) the pack icon.
function Tile({ brand, size = 56 }: { brand?: string; size?: number }) {
  const picture = brand ? BRAND_IMAGES[brand] : undefined;
  const iconHeight = Math.round(size * 0.54);
  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#dcc090]/50 bg-white"
      style={{ width: size, height: size }}
    >
      {picture ? (
        <Image src={picture} alt="" fill className="object-cover" />
      ) : (
        <span
          className="relative block"
          style={{ height: iconHeight, width: Math.round(iconHeight * 0.53) }}
        >
          <Image src={cigaretteIcon} alt="" fill className="object-contain" />
        </span>
      )}
    </span>
  );
}

// The part of the screen that is really in view: a phone's keyboard covers the
// bottom of the page without making the page any shorter, so the sheet follows the
// visible part (above the keyboard) and not the page. `keyboard` is true while the
// part in view is much shorter than the page, which is what a keyboard does.
function useVisibleArea(active: boolean) {
  const [area, setArea] = useState<{
    top: number;
    height: number;
    keyboard: boolean;
  } | null>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!active || !viewport) return;
    let settle: number | undefined;
    const update = () => {
      const keyboard = window.innerHeight - viewport.height > 120;
      setArea({ top: viewport.offsetTop, height: viewport.height, keyboard });
      // An iPhone's browser can leave the screen moved down a little after the
      // keyboard has gone (the page behind the sheet looks scrolled): the page is
      // put back (it is fixed in place while the sheet is open, so it is at the top).
      if (!keyboard && viewport.offsetTop > 0) window.scrollTo(0, 0);
    };
    // The size is reported while the keyboard is still moving, and the last report
    // is not always the final one: read it again when it has stopped.
    const onChange = () => {
      update();
      window.clearTimeout(settle);
      settle = window.setTimeout(update, 350);
    };
    update();
    viewport.addEventListener("resize", onChange);
    viewport.addEventListener("scroll", onChange);
    return () => {
      window.clearTimeout(settle);
      viewport.removeEventListener("resize", onChange);
      viewport.removeEventListener("scroll", onChange);
    };
  }, [active]);
  return area;
}

// The page behind a phone's sheet stays where it is. `overflow: hidden` on the body
// does not stop an iPhone's browser from scrolling it (or from showing it moved,
// behind the sheet, once the keyboard has come and gone), so while the sheet is
// open the body is fixed in place, at the point it was scrolled to, and let go
// (and scrolled back there) when the sheet goes.
function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    const scrollY = window.scrollY;
    const saved = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    return () => {
      Object.assign(body.style, saved);
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
    };
  }, [active]);
}

// The sheet itself (how it comes up, closes and is pulled down) is the same as the
// other sheets'; what is in it is only there while it is open, so it opens clean
// every time.
export default function BrandSelectorModal({ open, onClose, onApply }: BrandSelectorModalProps) {
  const sheet = useSwipeSheet({ open, onClose });
  if (!sheet.mounted) return null;
  return <BrandSelectorSheet sheet={sheet} onApply={onApply} />;
}

// Choosing a cigarette in two steps: the brand first, then the cigarette of that
// brand, which is listed by name in every size it comes in ("Chapman Red, Ultra
// Slims"). The sheet comes up with the search field and the recommended brands, from
// A to Z (when the keyboard comes up it takes the part of the screen that is left
// over it). Once a brand is chosen its name is in the field and the list is that
// brand's cigarettes, from A to Z. Typing narrows whichever list it is (the name and
// the size are both searched).
// Choosing a brand leaves the keyboard where it is. Choosing a cigarette types its
// name and its size in the field (after the brand's, which every name starts with:
// "Chapman Red Ultra Slims"), closes the keyboard and leaves only that cigarette, as
// a big card with its picture, name and information, and Cancel and Submit at the
// very bottom of the sheet. Cancel and Submit are only there while the keyboard is
// down: if it comes up again the sheet is the part of the screen over it, as always,
// and they are not shown above the keyboard (to see them the keyboard has to be
// closed). Cancel is plain underlined text, 40% of the row (Submit is 60%), and
// deletes everything in the field: back to the brands. Changing the text takes the
// choice back too, removing some of it first of all: the cigarettes are listed again,
// narrowed to what is left.
function BrandSelectorSheet({
  sheet,
  onApply,
}: {
  sheet: ReturnType<typeof useSwipeSheet>;
  onApply: (item: SelectedProduct) => void;
}) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<Brand | null>(null);
  const [picked, setPicked] = useState<{ brand: string; product: BrandProduct } | null>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  const {
    sheetRef,
    contentRef,
    sheetStyle,
    dialog,
    closing,
    backdropClassName,
    handleProps,
    requestClose,
  } = sheet;
  useBodyScrollLock(!dialog);
  const [fieldFocused, setFieldFocused] = useState(false);
  const area = useVisibleArea(!dialog);
  // The keyboard is up when the field has the focus and the part of the screen in
  // view is much shorter than the page. Only then does the sheet follow the part in
  // view; in every other case it is the whole screen (what the screen last said about
  // its size is not always right, and the sheet would stop short of the bottom).
  const keyboardUp = !dialog && fieldFocused && !!area?.keyboard;

  // On a tablet the sheet is a panel that slides in from the right (see
  // `.size-modal-panel` in globals.css), not a sheet from the bottom. On a laptop and
  // larger it is a small dialog in the middle of the screen (see `.brand-modal-root`
  // and `.brand-modal-panel`), which comes in the way the other dialogs do.
  const desktop = useDesktop();
  const panelAnimation = !dialog
    ? ""
    : desktop
      ? closing
        ? "animate-modal-scale-out"
        : "animate-modal-scale-in"
      : closing
        ? "animate-size-modal-panel-out"
        : "animate-size-modal-panel-in";

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const text = normalize(query);
  // The brands whose name has what is typed; if there are none, the brands that
  // have a cigarette with it (so "perla" still finds Ararat).
  const brandResults = useMemo(() => {
    if (!text) return BRANDS;
    const byName = BRANDS.filter((b) => b.key.includes(text));
    return byName.length > 0
      ? byName
      : BRANDS.filter((b) => b.products.some((p) => p.key.includes(text)));
  }, [text]);
  // Before a brand is chosen, the cigarettes that what is typed is another name of
  // ("seri barak ararat" is Ararat Silver, Ultra Slims): only those are listed.
  const aliasResults = useMemo(() => (brand ? [] : findByAlias(text)), [brand, text]);
  // The brand's cigarettes (every name in every size), narrowed to what is typed.
  // The name and the size are both searched, so "chapman red ultra" finds Chapman
  // Red in Ultra Slims, and so does the text the field has once it is chosen.
  const productResults = useMemo(
    () =>
      brand
        ? brand.products.filter((p) => {
            if (!text) return true;
            // The name, the size and the version are searched, in the order the field
            // writes them ("akhtamar mt ultra slims v2") or with the version after the name
            // ("akhtamar mt v2").
            const v = p.version ? ` v${p.version}` : "";
            const size = p.category.toLowerCase();
            return `${p.key} ${size}${v}`.includes(text) || `${p.key}${v} ${size}`.includes(text);
          })
        : [],
    [brand, text],
  );

  const chooseBrand = (next: Brand) => {
    setBrand(next);
    setQuery(next.name);
    setPicked(null);
    contentRef.current?.scrollTo({ top: 0 });
  };

  const chooseProduct = (product: BrandProduct, owner: Brand | null = brand) => {
    if (!owner) return;
    // (Found by its other name, the brand is chosen with it.)
    if (owner !== brand) setBrand(owner);
    setPicked({ brand: owner.name, product });
    // Its name goes in the field (it starts with the brand's, so it is typed on after
    // it) and the size after the name, and the keyboard goes away: Cancel and Submit,
    // at the bottom of the sheet, are under it otherwise.
    setQuery(`${product.name} ${product.category}${product.version ? ` v${product.version}` : ""}`);
    inputRef.current?.blur();
    // (A phone's keyboard can stay up for a box that still has a cursor in it.)
    window.getSelection()?.removeAllRanges();
    contentRef.current?.scrollTo({ top: 0 });
  };

  // Everything in the field is deleted: back to the brands, as if nothing had been
  // chosen.
  const cancelAll = () => {
    setQuery("");
    setBrand(null);
    setPicked(null);
    contentRef.current?.scrollTo({ top: 0 });
  };

  const confirm = () => {
    if (!picked) return;
    onApply({
      brand: picked.brand,
      name: picked.product.label,
      category: picked.product.category,
    });
  };

  const onType = (value: string) => {
    setQuery(value);
    // Any change of the text (removing some of it, first of all) takes the choice
    // back: the cigarettes are listed again, narrowed to what is left.
    if (picked) setPicked(null);
    // The whole name of a brand was typed (or pasted), alone or with more after it
    // ("marlboro", "marlboro gold"): the brand is chosen, as if it had been tapped in the
    // list, and its cigarettes are listed (what comes after its name narrows them).
    const typedBrand = brandNamedIn(normalize(value));
    if (typedBrand) {
      if (typedBrand !== brand) {
        setBrand(typedBrand);
        contentRef.current?.scrollTo({ top: 0 });
      }
    } else if (brand && !normalize(value).startsWith(brand.key)) {
      // The brand's name was changed: back to the brands.
      setBrand(null);
    }
  };

  // The × in the field: the same, and the cursor is in the field to type again.
  const clear = () => {
    cancelAll();
    inputRef.current?.focus();
  };

  // The Enter (search) key of the keyboard.
  const onEnter = () => {
    if (!brand) {
      if (aliasResults[0]) chooseProduct(aliasResults[0].product, aliasResults[0].brand);
      else if (brandResults[0]) chooseBrand(brandResults[0]);
    } else if (picked) {
      confirm();
    } else if (productResults.length === 1) {
      chooseProduct(productResults[0]);
    }
  };

  const label = brand
    ? text === brand.key
      ? "Recommended products"
      : "Products"
    : aliasResults.length > 0 && brandResults.length === 0
      ? "Products"
      : text
        ? "Brands"
        : "Recommended brands";

  return (
    <div
      className="size-modal-root brand-modal-root fixed inset-0 z-[110] flex items-end justify-center text-left sm:items-center sm:p-4 sm:pt-20"
      style={keyboardUp && area ? { top: area.top, height: area.height, bottom: "auto" } : undefined}
    >
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
        aria-label="Select cigarette"
        style={{
          ...sheetStyle,
          ...(dialog ? {} : { height: SHEET_HEIGHT }),
        }}
        className={`size-modal-panel brand-modal-panel relative z-10 flex w-full max-w-[40rem] flex-col overflow-hidden rounded-t-[1.75rem] bg-[#efefef] shadow-[0_-20px_60px_rgba(0,0,0,0.25)] sm:rounded-[1.75rem] sm:shadow-[0_20px_60px_rgba(0,0,0,0.25)] ${panelAnimation}`}
      >
        <div
          {...handleProps}
          className="sheet-handle flex shrink-0 touch-none justify-center py-3"
        >
          <div className="h-1 w-10 rounded-full bg-black/20" />
        </div>

        <div className="shrink-0 px-6 pt-1 sm:px-8 sm:pt-6">
          <div className="flex items-center gap-3">
            <div className="relative min-w-0 flex-1" role="search">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-4 z-10 h-5 w-5 -translate-y-1/2 text-[#9d9d9d]" />
              <SearchField
                fieldRef={inputRef}
                value={query}
                onChange={onType}
                onEnter={onEnter}
                onFocusChange={setFieldFocused}
              />
              {query && (
                <button
                  type="button"
                  onMouseDown={keepFocus}
                  onClick={clear}
                  aria-label="Clear"
                  className="absolute top-1/2 right-3 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#9d9d9d] transition-colors hover:text-[#414141]"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* The panel of a tablet and larger has a button to close it (a
                phone's sheet is closed by pulling it down). */}
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close"
              className="size-modal-close hidden shrink-0 text-[#9d9d9d] transition-colors hover:text-[#414141]"
            >
              <CloseIcon className="h-8 w-8" />
            </button>
          </div>
        </div>

        <div
          ref={contentRef}
          className={`mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 ${
            picked ? "pb-4" : "pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          }`}
        >
          {picked ? (
            // The cigarette that was chosen, alone: a big picture, its name and what
            // there is to know about it. (Cancel and Submit are under the list.)
            <div className="mx-1 mt-2 rounded-3xl bg-white p-4 shadow-[0_4px_22.5px_rgba(0,0,0,0.08)]">
              <div className="relative flex h-[132px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#f5f4f1]">
                <span className="relative block h-[96px] w-[51px]">
                  <Image src={cigaretteIcon} alt="" fill className="object-contain" />
                </span>
              </div>
              <h3 className="mt-4 text-[22px] leading-tight font-extrabold text-[#414141]">
                {picked.product.name}
              </h3>
              <dl className="mt-2 divide-y divide-black/5 text-[14px]">
                <div className="flex items-center justify-between gap-4 py-1.5">
                  <dt className="text-[#9d9d9d]">Brand</dt>
                  <dd className="font-bold text-[#414141]">{picked.brand}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-1.5">
                  <dt className="text-[#9d9d9d]">Size</dt>
                  <dd className="font-bold text-[#414141]">{picked.product.category}</dd>
                </div>
                {picked.product.version > 0 && (
                  <div className="flex items-center justify-between gap-4 py-1.5">
                    <dt className="text-[#9d9d9d]">Version</dt>
                    <dd className="font-bold text-[#414141]">
                      {picked.product.version} of {picked.product.versions}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <p
              className="px-2 pt-1 pb-1 text-[13px] leading-5 font-medium text-[#9d9d9d]"
              style={{ height: LABEL_H }}
            >
              {label}
            </p>
          )}

          {!picked &&
            !brand &&
            aliasResults.map(({ brand: owner, product: p }) => (
              <button
                key={`alias-${p.category}-${p.label}`}
                type="button"
                onMouseDown={keepFocus}
                onClick={() => chooseProduct(p, owner)}
                style={{ height: ROW_HEIGHT }}
                className="flex w-full items-center gap-4 rounded-2xl px-2 text-left transition-colors active:bg-white/70"
              >
                <Tile />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] leading-tight font-bold text-[#414141]">
                    {p.name}
                  </span>
                  <span className="block text-[14px] leading-snug text-[#9d9d9d]">
                    {p.category}
                    {p.version ? ` v${p.version}` : ""}
                  </span>
                </span>
              </button>
            ))}

          {!picked &&
            !brand &&
            brandResults.map((b) => (
              <button
                key={b.key}
                type="button"
                onMouseDown={keepFocus}
                onClick={() => chooseBrand(b)}
                style={{ height: ROW_HEIGHT }}
                className="flex w-full items-center gap-4 rounded-2xl px-2 text-left transition-colors active:bg-white/70"
              >
                <Tile brand={b.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] leading-tight font-bold text-[#414141]">
                    {b.name}
                  </span>
                  <span className="block text-[14px] leading-snug text-[#9d9d9d]">
                    {b.products.length} {b.products.length === 1 ? "product" : "products"}
                  </span>
                </span>
                <ChevronIcon className="h-5 w-5 shrink-0 text-[#c4c4c4]" />
              </button>
            ))}

          {!picked &&
            brand &&
            productResults.map((p) => (
              <button
                key={`${p.category}-${p.label}`}
                type="button"
                onMouseDown={keepFocus}
                onClick={() => chooseProduct(p)}
                style={{ height: ROW_HEIGHT }}
                className="flex w-full items-center gap-4 rounded-2xl px-2 text-left transition-colors active:bg-white/70"
              >
                <Tile />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] leading-tight font-bold text-[#414141]">
                    {p.name}
                  </span>
                  <span className="block text-[14px] leading-snug text-[#9d9d9d]">
                    {p.category}
                    {p.version ? ` v${p.version}` : ""}
                  </span>
                </span>
              </button>
            ))}

          {!picked &&
            ((!brand && brandResults.length === 0 && aliasResults.length === 0) ||
              (brand && productResults.length === 0)) && (
              <p className="px-2 py-6 text-sm text-[#9d9d9d]">
                {brand ? "No cigarettes match" : "No brands match"} “{query.trim()}”.
              </p>
            )}
        </div>

        {picked && !keyboardUp && (
          <div className="flex shrink-0 items-center gap-3 border-t border-black/5 bg-[#efefef] px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8">
            {/* 40% and 60% of the row (what is left after the space between them). */}
            <button
              type="button"
              onClick={cancelAll}
              className="inline-flex h-14 min-w-0 flex-[2] basis-0 items-center justify-center text-sm font-extrabold tracking-[0.2em] text-[#414141] uppercase underline decoration-2 underline-offset-[6px] transition-colors hover:text-black"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              className="inline-flex h-14 min-w-0 flex-[3] basis-0 items-center justify-center rounded-full bg-[#dcc090] text-sm font-extrabold tracking-[0.2em] text-[#122a26] uppercase transition-colors hover:bg-[#d3b57c]"
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
