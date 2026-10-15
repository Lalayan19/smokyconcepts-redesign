import Link from "next/link";
import { notFound } from "next/navigation";

import { BUTTON_EDGE } from "@/components/buttonEdge";
import PassportCoin from "@/components/PassportCoin";
import { PASSPORTS, findPassport } from "@/data/passports";

// The product passport: one screen (the height of the window under the header, see
// `.passport-page` in globals.css), the same on a phone, a tablet, a laptop and a desktop,
// one page for each collection (`/passport/classic`, `/passport/premium`,
// `/passport/atelier`, `/passport/special-edition`). The site footer is not shown here.

export function generateStaticParams() {
  return PASSPORTS.map((p) => ({ collection: p.slug }));
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VerifiedPill({ className }: { className: string }) {
  return (
    <span className={`passport-pill ${className}`}>
      <CheckIcon className="h-3 w-3" />
      Verified Authentic
    </span>
  );
}

export default async function PassportPage({ params }: PageProps<"/passport/[collection]">) {
  const { collection } = await params;
  const passport = findPassport(collection);
  if (!passport) notFound();

  const rows: { label: string; value: React.ReactNode; gold?: boolean }[] = [
    { label: "Serial no.", value: `SC-${passport.code}-US-[000127]`, gold: true },
    {
      label: "Model",
      value: (
        <span className="flex items-center justify-end gap-2">
          {passport.model}
          <span className="passport-badge">{passport.collection}</span>
        </span>
      ),
    },
    { label: "Size", value: passport.size },
    { label: "Personal text", value: "[“Your text”]" },
    { label: "Purchased", value: "[DD.MM.YYYY]" },
    {
      label: "Status",
      value: (
        <span className="flex items-center justify-end gap-2">
          <span className="passport-dot" aria-hidden="true" />
          Sold · Registered
        </span>
      ),
    },
  ];

  return (
    <main className="passport-page font-montserrat">
      <div className="passport-inner">
        <section className="passport-hero">
          <PassportCoin coin={passport.coin} alt={`${passport.collection} collection coin`} />

          {/* On a phone the pill is under the coin; wider screens have it above the
              text on the right. */}
          <VerifiedPill className="passport-pill-narrow" />
          <p className="passport-eyebrow">Collection</p>
          <h1 className="passport-title">{passport.collection}</h1>
          <p className="passport-tagline">{passport.tagline}</p>
        </section>

        <section className="passport-details">
          <VerifiedPill className="passport-pill-wide" />
          <h2 className="passport-headline">
            This piece is a genuine Smoky Concepts accessory, registered as sold.
          </h2>

          <dl className="passport-card">
            {rows.map((row) => (
              <div key={row.label} className="passport-row">
                <dt>{row.label}</dt>
                <dd className={row.gold ? "passport-gold" : undefined}>{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="passport-actions">
            <Link
              href={passport.shopHref}
              style={{ letterSpacing: "0.12em", ...BUTTON_EDGE }}
              className="passport-shop font-montserrat"
            >
              SHOP
            </Link>
            <a
              href="mailto:official@smokyconcepts.com"
              style={{ letterSpacing: "0.12em" }}
              className="passport-contact font-montserrat"
            >
              CONTACT US
            </a>
          </div>
        </section>
      </div>

      <div className="passport-foot">
        <p>Unique Accessories for Your Rituals.</p>
        <p className="passport-foot-site">smokyconcepts.com</p>
      </div>
    </main>
  );
}
