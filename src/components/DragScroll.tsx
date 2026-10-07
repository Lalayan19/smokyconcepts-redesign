"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A row that scrolls sideways (the browser's own scrolling: a finger, a trackpad,
// the keyboard) and that can also be grabbed and dragged with a mouse, which has
// no way to scroll a row without a scrollbar. A touch or a pen is left to the
// browser, so on a phone this changes nothing.
//
// It is the same `div` as it would be without this: the classes are the row's.
export default function DragScroll({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    let drag: { id: number; startX: number; startLeft: number; moved: boolean } | null = null;
    let suppressClick = false;
    let suppressTimer: number | undefined;

    // The grabbing hand only where there is something to move.
    const markScrollable = () => {
      row.toggleAttribute("data-scrollable", row.scrollWidth > row.clientWidth + 1);
    };
    markScrollable();
    const observer = new ResizeObserver(markScrollable);
    observer.observe(row);

    const onPointerMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.startX;
      if (!drag.moved) {
        if (Math.abs(dx) <= 4) return;
        drag.moved = true;
        // Scroll snapping would pull the row back while it is being dragged.
        row.style.scrollSnapType = "none";
        row.style.cursor = "grabbing";
        row.style.userSelect = "none";
      }
      row.scrollLeft = drag.startLeft - dx;
    };
    const endDrag = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const moved = drag.moved;
      drag = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      row.style.scrollSnapType = "";
      row.style.cursor = "";
      row.style.userSelect = "";
      if (moved) {
        // Letting go of a drag over a card must not open it.
        suppressClick = true;
        window.clearTimeout(suppressTimer);
        suppressTimer = window.setTimeout(() => {
          suppressClick = false;
        }, 350);
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if (row.scrollWidth <= row.clientWidth + 1) return;
      drag = { id: e.pointerId, startX: e.clientX, startLeft: row.scrollLeft, moved: false };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
    };
    const onClickCapture = (e: MouseEvent) => {
      if (!suppressClick) return;
      e.preventDefault();
      e.stopPropagation();
    };
    // The links and pictures in the row would otherwise start a browser drag-and-drop.
    const onDragStart = (e: Event) => e.preventDefault();

    row.addEventListener("pointerdown", onPointerDown);
    row.addEventListener("click", onClickCapture, true);
    row.addEventListener("dragstart", onDragStart);
    return () => {
      observer.disconnect();
      window.clearTimeout(suppressTimer);
      row.removeEventListener("pointerdown", onPointerDown);
      row.removeEventListener("click", onClickCapture, true);
      row.removeEventListener("dragstart", onDragStart);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, []);

  return (
    <div ref={rowRef} className={`drag-scroll ${className}`}>
      {children}
    </div>
  );
}
