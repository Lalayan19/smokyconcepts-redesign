const STEPS = [
  {
    title: "Remove the cigarette pack's wrapper",
    subtitle: "Հեռացրեք ծխախոտի տուփի թաղանթը",
  },
  {
    title: "Open the case",
    subtitle: "Բացեք պատյանը",
  },
  {
    title: "Insert the cigarette pack into the case",
    subtitle: "Տեղադրեք ծխախոտի տուփը պատյանի մեջ",
  },
  {
    title: "Close the case with force",
    subtitle: "Ուժգին փակեք պատյանը",
  },
];

function UnwrapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <rect x="20" y="10" width="24" height="40" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 22 L44 18 M20 34 L44 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M46 14 C 52 18, 54 26, 50 32"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M46 28 L50 32 L48 37" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function OpenCaseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <rect x="8" y="16" width="18" height="34" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="34" y="24" width="18" height="26" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M34 24 L46 10 L58 18 L48 26"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function InsertIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <rect x="10" y="6" width="16" height="26" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="34" y="20" width="18" height="30" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="38" y="26" width="10" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M18 34 L18 46" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 41 L18 46 L23 41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <rect x="18" y="18" width="18" height="30" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M36 18 L48 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M44 8 C 50 10, 52 16, 48 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M43 21 L48 20 L47 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

const ICONS = [UnwrapIcon, OpenCaseIcon, InsertIcon, CloseIcon];

export default function HowToUse() {
  return (
    <section className="rounded-[1.5rem] bg-white px-6 py-10 shadow-[0_4px_22.5px_rgba(0,0,0,0.08)] sm:px-10">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold tracking-[0.05em] text-[#dcc090] uppercase sm:text-3xl">
          How to Use
        </h2>
        <p className="mt-1 text-xs font-semibold tracking-[0.1em] text-[#dcc090]/80 uppercase">
          Օգտագործման կանոններ
        </p>
      </div>

      <ol className="mt-9 flex flex-col gap-9">
        {STEPS.map((step, index) => {
          const Icon = ICONS[index];
          return (
            <li key={step.title} className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dcc090]/15 text-sm font-extrabold text-[#dcc090]">
                {index + 1}
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="inline-block w-fit border-b-2 border-[#dcc090] pb-1 text-[15px] font-bold text-[#414141]">
                    {step.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#6b6b6b]">{step.subtitle}</p>
                </div>
                <Icon className="h-12 w-12 shrink-0 text-[#414141]" />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
