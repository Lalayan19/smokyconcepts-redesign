import Link from "next/link";

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms and conditions", href: "/terms" },
  { label: "Delivery Terms", href: "/delivery-terms" },
  { label: "Refund Policy", href: "/refund-policy" },
];

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

export default function Footer() {
  return (
    <footer className="bg-[#122a26]">
      <div className="mx-auto flex max-w-[120rem] flex-col gap-10 px-4 py-16 text-[#dcc090] sm:px-8 lg:px-[7.5rem]">
        <div className="grid justify-items-center gap-10 text-center lg:grid-cols-[1fr_auto_1fr] lg:items-start lg:justify-items-stretch lg:text-left">
          <div className="order-2 flex flex-col items-center gap-4 text-sm font-medium leading-[1.4] lg:order-1 lg:items-start">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-opacity hover:opacity-80"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="order-1 flex flex-col items-center gap-4 text-center lg:order-2">
            <p className="text-sm font-extrabold">Contact info</p>
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
            <p className="text-sm font-extrabold">Created by</p>
            <p className="text-sm font-extrabold">Designed by</p>
          </div>
        </div>

        <p className="text-center text-xs font-medium">
          Copyright© 2026. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
