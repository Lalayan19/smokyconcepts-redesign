function TruckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2 6h11v9H2V6ZM13 10h4l4 3.5V15h-8v-5ZM6 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ROWS = [
  {
    icon: TruckIcon,
    title: "Shipping Details",
    subtitle:
      "Shipping time depends on the model you choose. In-stock items ship within 2–3 business days. Made-to-order pieces are hand-assembled after your order is placed, with delivery in 5–10 business days. Currently delivering within Yerevan — expanding soon to the rest of Armenia and worldwide.",
  },
];

export default function DeliveryInfo() {
  return (
    <section className="mt-5 rounded-[1.5rem] bg-white p-5 shadow-[0_4px_22.5px_rgba(0,0,0,0.08)]">
      <h2 className="text-[11px] font-bold tracking-wider text-[#898989] uppercase">
        Delivery &amp; Availability
      </h2>

      <div className="mt-1 flex flex-col divide-y divide-black/5">
        {ROWS.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.title} className="flex items-start gap-4 py-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#122a26]/[0.07]">
                <Icon className="h-6 w-6 text-[#122a26]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#414141]">{row.title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-[#898989]">
                  {row.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
