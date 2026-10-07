"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// A tablet and larger (the same screens as the "tablet and up" rules in
// globals.css) get a plain modal: it appears where it is (the modal's own
// animation, not sliding up from the bottom), and it does not follow a finger or a
// mouse down to close. A phone keeps the sheet.
const DIALOG_QUERY = "(min-width: 744px) and (min-height: 500px)";
function subscribeDialog(onChange: () => void) {
  const query = window.matchMedia(DIALOG_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const getDialog = () => window.matchMedia(DIALOG_QUERY).matches;
const getServerDialog = () => false;

const CLOSE_VELOCITY = 0.55; // px/ms
// How far a finger has to move before it counts as pulling the sheet down (or
// as scrolling the list).
const PULL_SLOP = 8;
const CLOSE_MS = 300;
const CLOSE_UNMOUNT_DELAY = 340;
const SETTLE_TRANSITION = "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)";
const CLOSE_TRANSITION = `transform ${CLOSE_MS}ms cubic-bezier(0.4, 0, 1, 1)`;

// Browsers can auto-release pointer capture (e.g. right before pointerup
// fires) before our own release call runs, which throws. Capture itself can
// also fail for a pointerId the browser no longer considers active. Neither
// case should ever crash the gesture handler.
function setPointerCaptureSafe(el: EventTarget | null, pointerId: number) {
  try {
    (el as HTMLElement)?.setPointerCapture?.(pointerId);
  } catch {
    // ignored
  }
}

function releasePointerCaptureSafe(el: EventTarget | null, pointerId: number) {
  try {
    (el as HTMLElement)?.releasePointerCapture?.(pointerId);
  } catch {
    // ignored
  }
}

type UseSwipeSheetOptions = {
  open: boolean;
  onClose: () => void;
};

export function useSwipeSheet({ open, onClose }: UseSwipeSheetOptions) {
  const dialog = useSyncExternalStore(subscribeDialog, getDialog, getServerDialog);
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const [entered, setEntered] = useState(false);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sheetHeight = useRef(0);

  const dragStartY = useRef(0);
  const dragStartOffset = useRef(0);
  const dragStartTime = useRef(0);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      setOffset(0);
      setEntered(false);
      const timer = setTimeout(() => setEntered(true), 20);
      return () => clearTimeout(timer);
    } else if (mounted) {
      setClosing(true);
      setEntered(false);
      const timeout = setTimeout(() => {
        setMounted(false);
        setClosing(false);
        setOffset(0);
      }, CLOSE_UNMOUNT_DELAY);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // While the sheet is open the page behind it must stay put. `overflow: hidden`
  // on the body is not enough on iOS (Safari and Chrome there are the same
  // engine): once the page has been pinch-zoomed it can still be dragged round
  // behind the sheet, and a pinch goes on panning it for as long as the fingers
  // stay down. So, as well:
  //  - two fingers never zoom or pan anything while the sheet is open;
  //  - one finger only does something on the sheet's own list (which scrolls,
  //    and is `overscroll-contain`); on the dark backdrop, the handle or the
  //    buttons under the list there is nothing to scroll, so nothing moves.
  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = "hidden";

    const cancel = (e: Event) => {
      if (e.cancelable) e.preventDefault();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        cancel(e);
        return;
      }
      const content = contentRef.current;
      if (content && e.target instanceof Node && content.contains(e.target)) return;
      cancel(e);
    };
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    // Safari's own pinch events.
    document.addEventListener("gesturestart", cancel);
    document.addEventListener("gesturechange", cancel);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("gesturestart", cancel);
      document.removeEventListener("gesturechange", cancel);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || closing) return;
    const el = sheetRef.current;
    if (!el) return;
    const measure = () => {
      sheetHeight.current = el.getBoundingClientRect().height;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted, closing]);

  const runClose = useCallback(() => {
    setDragging(false);
    sheetHeight.current = sheetRef.current?.getBoundingClientRect().height || sheetHeight.current;
    setEntered(false);
    setOffset(sheetHeight.current || 800);
    onClose();
  }, [onClose]);

  const settleAfterDrag = useCallback(
    (finalOffset: number, velocity: number) => {
      const height = sheetHeight.current || 1;
      const shouldClose =
        finalOffset > height * 0.5 || velocity > CLOSE_VELOCITY;
      if (shouldClose) {
        runClose();
      } else {
        setOffset(0);
      }
    },
    [runClose],
  );

  // ---- drag via the handle (always active) ----
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (dialog) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragStartY.current = e.clientY;
      dragStartOffset.current = offset;
      dragStartTime.current = performance.now();
      sheetHeight.current = sheetRef.current?.getBoundingClientRect().height || sheetHeight.current;
      setDragging(true);
      setPointerCaptureSafe(e.target, e.pointerId);
    },
    [offset, dialog],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const delta = e.clientY - dragStartY.current;
      setOffset(Math.max(0, dragStartOffset.current + delta));
    },
    [dragging],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      setDragging(false);
      const elapsed = Math.max(1, performance.now() - dragStartTime.current);
      settleAfterDrag(offset, offset / elapsed);
      releasePointerCaptureSafe(e.target, e.pointerId);
    },
    [dragging, offset, settleAfterDrag],
  );

  // ---- pulling the sheet down from its content ----
  //
  // The content scrolls natively (momentum, the keyboard's own scrolling, text
  // selection, native clicks on what is inside it). A touch that begins with
  // the content already scrolled to the top and then pulls down takes the sheet
  // with it; one that scrolls the list, or begins further down, is left alone.
  // So is a sideways swipe (the rows of sizes scroll sideways): it only counts
  // as pulling the sheet if it is clearly more down than across, and once it has
  // been judged sideways it is never taken over, however much it drifts down.
  // (The content is `overscroll-contain`, so nothing else moves while this
  // happens and the move can be cancelled.)
  useEffect(() => {
    if (!mounted || dialog) return;
    const content = contentRef.current;
    if (!content) return;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let tracking = false;
    let pulling = false;
    let lastOffset = 0;

    const onTouchStart = (e: TouchEvent) => {
      tracking = e.touches.length === 1 && content.scrollTop <= 0;
      pulling = false;
      lastOffset = 0;
      startX = e.touches[0]?.clientX ?? 0;
      startY = e.touches[0]?.clientY ?? 0;
      startT = performance.now();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return;
      const delta = e.touches[0].clientY - startY;
      const across = Math.abs(e.touches[0].clientX - startX);
      if (!pulling) {
        if (across > PULL_SLOP && across >= Math.abs(delta)) {
          tracking = false; // a sideways swipe: not ours
          return;
        }
        if (delta < -PULL_SLOP || content.scrollTop > 0) {
          tracking = false; // it is scrolling the list
          return;
        }
        // Not (yet) clearly a pull down.
        if (delta <= PULL_SLOP || delta <= across) return;
        pulling = true;
        sheetHeight.current =
          sheetRef.current?.getBoundingClientRect().height || sheetHeight.current;
        setDragging(true);
      }
      if (e.cancelable) e.preventDefault();
      lastOffset = Math.max(0, delta - PULL_SLOP);
      setOffset(lastOffset);
    };
    const onTouchEnd = (e: TouchEvent) => {
      tracking = false;
      if (!pulling) return;
      pulling = false;
      setDragging(false);
      const elapsed = Math.max(1, performance.now() - startT);
      // A gesture the browser cancelled has no speed to speak of.
      settleAfterDrag(lastOffset, e.type === "touchcancel" ? 0 : lastOffset / elapsed);
    };

    content.addEventListener("touchstart", onTouchStart, { passive: true });
    content.addEventListener("touchmove", onTouchMove, { passive: false });
    content.addEventListener("touchend", onTouchEnd);
    content.addEventListener("touchcancel", onTouchEnd);
    return () => {
      content.removeEventListener("touchstart", onTouchStart);
      content.removeEventListener("touchmove", onTouchMove);
      content.removeEventListener("touchend", onTouchEnd);
      content.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [mounted, dialog, settleAfterDrag]);

  const requestClose = useCallback(() => {
    if (dragging) return;
    runClose();
  }, [dragging, runClose]);

  let sheetStyle: React.CSSProperties;
  if (dialog) {
    // A modal does not move; it appears with its own animation.
    sheetStyle = {};
  } else if (!entered && !closing && !dragging) {
    sheetStyle = { transform: "translateY(100%)", transition: "none" };
  } else if (dragging) {
    sheetStyle = { transform: `translateY(${offset}px)`, transition: "none" };
  } else if (closing) {
    sheetStyle = { transform: `translateY(${offset}px)`, transition: CLOSE_TRANSITION };
  } else {
    sheetStyle = { transform: `translateY(${offset}px)`, transition: SETTLE_TRANSITION };
  }

  return {
    mounted,
    closing,
    // True on a tablet and larger, where the sheet is a plain modal: the panel
    // puts `modalAnimation` (below) on itself, or its own animation.
    dialog,
    modalAnimation: dialog
      ? closing
        ? "animate-modal-scale-out"
        : "animate-modal-scale-in"
      : "",
    sheetRef,
    contentRef,
    dragging,
    sheetStyle,
    backdropClassName: closing
      ? "animate-size-modal-backdrop-out"
      : "animate-size-modal-backdrop-in",
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    requestClose,
  };
}
