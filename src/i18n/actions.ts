"use server";

import { cookies } from "next/headers";

import { isLocale, LANGUAGE_COOKIE } from "./config";

// Called by the language menu in the header: keeps the language in a cookie for a year. The page
// is drawn again by the server in that language (Next does it after an action that sets a cookie).
export async function setLanguage(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LANGUAGE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
