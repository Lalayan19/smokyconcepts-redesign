"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import SizeSelectorModal from "@/components/SizeSelectorModal";

export default function ChooseCigaretteSection() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleApply = (item: { category: string; name: string }) => {
    setOpen(false);
    const params = new URLSearchParams({
      size: item.category,
      cigarette: item.name,
    });
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <section className="flex flex-col items-center gap-6 text-center sm:gap-8">
      <h2 className="text-[2.125rem] font-extrabold leading-[1.235] text-[#414141] sm:text-4xl sm:leading-tight">
        Choose your cigarette
      </h2>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#dcc090] px-7 text-sm font-extrabold tracking-[0.2em] text-[#122a26] uppercase transition-colors hover:bg-[#d3b57c] sm:min-h-12 sm:px-9"
      >
        Choose
      </button>

      <SizeSelectorModal
        open={open}
        onClose={() => setOpen(false)}
        onApply={handleApply}
      />
    </section>
  );
}
