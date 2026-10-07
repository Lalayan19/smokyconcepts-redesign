import type { CSSProperties } from "react";

// The thin white edge and the barely-there shadow around the gold buttons of the
// homepage sections (collections, ultra slims, popular sizes, personalization,
// about). Kept in one place so the two values are easy to tune.
export const BUTTON_EDGE: CSSProperties = {
  border: "1px solid #ffffff",
  boxShadow: "0 0 2px rgba(0, 0, 0, 0.3)",
};
