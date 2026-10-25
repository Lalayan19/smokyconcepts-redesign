import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import applePay from "@/assets/icons/apple-pay.svg";
import googlePay from "@/assets/icons/google-pay.svg";
import idram from "@/assets/icons/idram.png";
import mastercard from "@/assets/icons/mastercard.svg";
import visa from "@/assets/icons/visa.svg";

// The ways to pay, shown under the copyright, all in the same size (3 : 2, like
// the cards' own drawings). The drawings (SVG) have their own white card behind
// them; Idram's logo is a picture on a see-through background, so it is given the
// same white card (with the same corners) and fitted inside it (the picture has
// room of its own around the logo).
const PAYMENT_METHODS = [
  { label: "Apple Pay", src: applePay, onWhiteCard: false },
  { label: "Google Pay", src: googlePay, onWhiteCard: false },
  { label: "Visa", src: visa, onWhiteCard: false },
  { label: "Mastercard", src: mastercard, onWhiteCard: false },
  { label: "Idram", src: idram, onWhiteCard: true },
];

// The names are in messages/*.json (`Footer`).
const LEGAL_LINKS = [
  { key: "privacy", href: "/privacy" },
  { key: "terms", href: "/terms" },
  { key: "delivery", href: "/delivery-terms" },
  { key: "refund", href: "/refund-policy" },
] as const;

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.5 2h-3v13.2a2.8 2.8 0 1 1-2-2.68V9.3a6 6 0 1 0 5 5.92V9.1a7.6 7.6 0 0 0 4.5 1.46V7.4A4.5 4.5 0 0 1 16.5 2Z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="5.5" width="20" height="13" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.5 9.5L15 12L10.5 14.5V9.5Z" fill="currentColor" />
    </svg>
  );
}

export default async function Footer() {
  const t = await getTranslations("Footer");
  return (
    <footer className="site-footer rounded-t-[1.5rem] bg-[#122a26]">
      <div className="mx-auto flex max-w-[120rem] flex-col gap-10 px-4 py-16 text-[#dcc090] sm:px-8 lg:px-[7.5rem]">
        <div className="grid justify-items-center gap-10 text-center lg:grid-cols-[1fr_auto_1fr] lg:items-start lg:justify-items-stretch lg:text-left">
          <div className="order-2 flex flex-col items-center gap-4 text-sm font-medium leading-[1.4] lg:order-1 lg:items-start">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-opacity hover:opacity-80"
              >
                {t(link.key)}
              </Link>
            ))}
          </div>

          <div className="order-1 flex flex-col items-center gap-4 text-center lg:order-2">
            <p className="text-sm font-extrabold">{t("contact")}</p>
            <a
              href="mailto:official@smokyconcepts.com"
              className="text-sm font-medium transition-opacity hover:opacity-80"
            >
              official@smokyconcepts.com
            </a>
            <a
              href="https://wa.me/37443151551"
              className="text-sm font-medium transition-opacity hover:opacity-80"
            >
              WhatsApp: +374 43151551
            </a>
            <div className="flex items-center gap-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="inline-flex h-8 w-8 items-center justify-center transition-transform hover:scale-105"
              >
                <InstagramIcon className="h-6 w-6" />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="inline-flex h-8 w-8 items-center justify-center transition-transform hover:scale-105"
              >
                <TikTokIcon className="h-6 w-6" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="inline-flex h-8 w-8 items-center justify-center transition-transform hover:scale-105"
              >
                <YouTubeIcon className="h-6 w-6" />
              </a>
            </div>
          </div>

          <div className="order-3 flex flex-col items-center gap-8 lg:items-end lg:text-right">
            <p className="text-sm font-extrabold">{t("createdBy")}</p>
            <p className="text-sm font-extrabold">{t("designedBy")}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <p className="text-center text-xs font-medium">
            {t("copyright")}
          </p>

          <ul aria-label="Payment methods" className="flex items-center justify-center gap-2">
            {PAYMENT_METHODS.map((method) => (
              <li key={method.label} className="flex h-8 w-12 shrink-0 items-center justify-center">
                <Image
                  src={method.src}
                  alt={method.label}
                  width={48}
                  height={32}
                  className={`h-8 w-12 ${
                    method.onWhiteCard ? "rounded-[1.6px] bg-white object-contain p-px" : ""
                  }`}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
