import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE, isLocale, LANGUAGE_COOKIE } from "./config";

// Every request: the language is the one in the cookie (English if there is none), and its texts
// are the file in /messages.
export default getRequestConfig(async () => {
  const saved = (await cookies()).get(LANGUAGE_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
