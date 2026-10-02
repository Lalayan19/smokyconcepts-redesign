"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CLOSE_VELOCITY = 0.55; // px/ms
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
  const contentDragActive = useRef(false);
  const contentScrollStart = useRef(0);

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

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
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
    contentDragActive.current = false;
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
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragStartY.current = e.clientY;
      dragStartOffset.current = offset;
      dragStartTime.current = performance.now();
      sheetHeight.current = sheetRef.current?.getBoundingClientRect().height || sheetHeight.current;
      setDragging(true);
      setPointerCaptureSafe(e.target, e.pointerId);
    },
    [offset],
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

  // ---- drag handoff from the scrollable content (works from anywhere in the
  // content; hands off to a sheet-drag once scrolled all the way to the top
  // and pulled further) ----
  //
  // Browsers do not reliably honor preventDefault() on pointer/touch move to
  // stop a scrollable element's own native scroll/bounce — touch-action is
  // the only mechanism every engine respects consistently, and it must be
  // set statically (via the "touch-none" class on the content element) since
  // mutating it at pointerdown time is still a race the browser can win
  // before our JS runs. So native scrolling is disabled on this element
  // entirely, and we drive its scrollTop ourselves for every gesture: normal
  // drags scroll the list, and once scrollTop would go below 0 we hand off
  // the remaining movement to the sheet's drag-to-close offset instead.
  const onContentPointerDown = useCallback((e: React.PointerEvent) => {
    const content = contentRef.current;
    dragStartY.current = e.clientY;
    dragStartTime.current = performance.now();
    contentDragActive.current = false;
    contentScrollStart.current = content?.scrollTop ?? 0;
    // Lock all subsequent events for this touch to this element, regardless
    // of where on screen the finger drifts during the gesture.
    setPointerCaptureSafe(e.target, e.pointerId);
  }, []);

  const onContentPointerMove = useCallback((e: React.PointerEvent) => {
    const content = contentRef.current;
    if (!content) return;
    const delta = e.clientY - dragStartY.current;
    e.preventDefault();

    if (contentDragActive.current) {
      setOffset(Math.max(0, delta - contentScrollStart.current));
      return;
    }

    const proposedScrollTop = contentScrollStart.current - delta;
    if (proposedScrollTop <= 0 && delta > 0) {
      // Scrolled all the way to the top and still being pulled down.
      contentDragActive.current = true;
      content.scrollTop = 0;
      sheetHeight.current = sheetRef.current?.getBoundingClientRect().height || sheetHeight.current;
      setDragging(true);
      setOffset(Math.max(0, delta - contentScrollStart.current));
      return;
    }

    const maxScrollTop = Math.max(0, content.scrollHeight - content.clientHeight);
    content.scrollTop = Math.min(maxScrollTop, Math.max(0, proposedScrollTop));
  }, []);

  const onContentPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!contentDragActive.current) return;
      contentDragActive.current = false;
      setDragging(false);
      const elapsed = Math.max(1, performance.now() - dragStartTime.current);
      settleAfterDrag(offset, offset / elapsed);
      releasePointerCaptureSafe(e.target, e.pointerId);
    },
    [offset, settleAfterDrag],
  );

  const requestClose = useCallback(() => {
    if (dragging) return;
    runClose();
  }, [dragging, runClose]);

  let sheetStyle: React.CSSProperties;
  if (!entered && !closing && !dragging) {
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
    contentDragProps: {
      onPointerDown: onContentPointerDown,
      onPointerMove: onContentPointerMove,
      onPointerUp: onContentPointerUp,
      onPointerCancel: onContentPointerUp,
    },
    requestClose,
  };
}
