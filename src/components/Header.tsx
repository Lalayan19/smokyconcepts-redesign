"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import logo from "@/assets/images/logo.svg";
import accountIcon from "@/assets/icons/account.svg";
import bagIcon from "@/assets/icons/bag.svg";
import currencyIcon from "@/assets/icons/currency-banknote.svg";
import globeIcon from "@/assets/icons/globe.svg";
import MobileMenuSheet from "@/components/MobileMenuSheet";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/personalization", label: "Personalization" },
];

const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "AMD", symbol: "֏" },
  { code: "RUB", symbol: "₽" },
];

const LANGUAGES = [
  { code: "EN", label: "English" },
  { code: "HY", label: "Հայերեն" },
  { code: "RU", label: "Русский" },
];

const NAV_TEXT_ACTIVE =
  "text-[15px] font-extrabold uppercase tracking-[0.1em] text-[#dcc090] transition-opacity";
const NAV_TEXT_INACTIVE =
  "text-[15px] font-normal uppercase tracking-[0.1em] text-[#dcc090]/80 transition-opacity hover:text-[#dcc090]";

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 6" fill="none" className={className} aria-hidden="true">
      <path
        d="M1 1L5 5L9 1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 6H21M3 12H21M3 18H21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 5L19 19M19 5L5 19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DropdownPanel({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute top-full z-20 mt-3 w-40 overflow-hidden rounded-xl border border-white/5 bg-brand-dark shadow-xl shadow-black/40 ${className}`}
    >
      {children}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const [currency, setCurrency] = useState(CURRENCIES[1]);
  const [language, setLanguage] = useState(LANGUAGES[0]);

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        currencyRef.current &&
        !currencyRef.current.contains(event.target as Node)
      ) {
        setCurrencyOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-[999999999999] w-full bg-brand-dark">
      <div className="site-header-inner px-4 py-3 md:px-8 xl:px-[120px]">
        <div className="relative flex h-10 items-center justify-between">
          <Link href="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
            <img src={logo.src} alt="Smoky Concepts" className="h-10 aspect-[4/1]" />
          </Link>

          {/* The menu is in the exact middle of the header, whatever the widths of the logo and of
              the buttons on the right (so it is not pushed off the middle by the wider side). */}
          <nav className="site-header-nav hidden items-center justify-center gap-10 md:absolute md:top-1/2 md:left-1/2 md:flex md:-translate-x-1/2 md:-translate-y-1/2">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={active ? NAV_TEXT_ACTIVE : NAV_TEXT_INACTIVE}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="site-header-actions hidden shrink-0 items-center gap-4 md:flex">
            <div ref={currencyRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setCurrencyOpen((open) => !open);
                  setLangOpen(false);
                }}
                className={`flex items-center gap-1.5 ${NAV_TEXT_INACTIVE}`}
              >
                <img
                  src={currencyIcon.src}
                  alt=""
                  className="w-[24px] h-[15px]"
                />
                {currency.code}
              </button>

              {currencyOpen && (
                <DropdownPanel className="left-0">
                  {CURRENCIES.map((c) => {
                    const selected = c.code === currency.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setCurrency(c);
                          setCurrencyOpen(false);
                        }}
                        className={`flex w-full items-center justify-between border-l-2 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                          selected
                            ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
                            : "border-transparent text-brand-muted hover:text-brand-gold"
                        }`}
                      >
                        {c.code}
                        <span>{c.symbol}</span>
                      </button>
                    );
                  })}
                </DropdownPanel>
              )}
            </div>

            <span className="text-brand-muted/40">/</span>

            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setLangOpen((open) => !open);
                  setCurrencyOpen(false);
                }}
                className={`flex items-center gap-1.5 ${NAV_TEXT_INACTIVE}`}
              >
                <img src={globeIcon.src} alt="" className="w-[20px] h-[20px]" />
                {language.code}
                <ChevronDownIcon
                  className={`h-2.5 w-2.5 transition-transform ${
                    langOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {langOpen && (
                <DropdownPanel className="left-0">
                  {LANGUAGES.map((l) => {
                    const selected = l.code === language.code;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLanguage(l);
                          setLangOpen(false);
                        }}
                        className={`flex w-full items-center justify-between border-l-2 px-4 py-3 text-sm font-semibold transition-colors ${
                          selected
                            ? "border-brand-gold bg-brand-gold/10 text-brand-gold"
                            : "border-transparent text-brand-muted hover:text-brand-gold"
                        }`}
                      >
                        {l.label}
                        <span className="uppercase">{l.code}</span>
                      </button>
                    );
                  })}
                </DropdownPanel>
              )}
            </div>

            <div className="ml-2 flex items-center gap-4 border-l border-brand-muted/20 pl-4">
              <button type="button" aria-label="Bag" className="text-brand-gold">
                <img src={bagIcon.src} alt="" className="w-[21px] h-[24px]" />
              </button>
              <button type="button" aria-label="Account" className="text-brand-gold">
                <img src={accountIcon.src} alt="" className="w-[24px] h-[24px]" />
              </button>
            </div>
          </div>

          <div className="site-header-mobile flex shrink-0 items-center gap-4 md:hidden">
            <button type="button" aria-label="Bag" className="text-brand-gold">
              <img src={bagIcon.src} alt="" className="w-[21px] h-[24px]" />
            </button>
            <button type="button" aria-label="Account" className="text-brand-gold">
              <img src={accountIcon.src} alt="" className="w-[24px] h-[24px]" />
            </button>
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="text-brand-gold"
            >
              {menuOpen ? (
                <CloseIcon className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

    </header>

    {/* The phone's menu: a sheet like the size and customize ones. It is outside
        the header, so the header (with the button that closes it) stays on top. */}
    <MobileMenuSheet
      open={menuOpen}
      onClose={() => setMenuOpen(false)}
      links={NAV_LINKS}
      pathname={pathname}
      currencies={CURRENCIES}
      currency={currency}
      onCurrencyChange={setCurrency}
      languages={LANGUAGES}
      language={language}
      onLanguageChange={setLanguage}
    />
    </>
  );
}
