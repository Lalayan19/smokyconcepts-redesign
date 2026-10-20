// The languages of the site's texts. There is no /en /ru /hy in the address: the language chosen
// in the header is kept in a cookie (so the server draws the page in it at once) and the address is
// the same in every language.
export const LOCALES = ["en", "ru", "hy"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LANGUAGE_COOKIE = "smoky-language";

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.some((locale) => locale === value);
}
