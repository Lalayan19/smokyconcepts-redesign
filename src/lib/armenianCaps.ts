// The Armenian letter "և" is one letter written as two (ե + ւ), and the browser's `uppercase` turns
// it into "ԵՒ". In capitals it is written "ԵՎ". Text that is shown in capitals (a class with
// `uppercase`) goes through this first, so it comes out as "ԵՎ"; text that is not in capitals keeps
// its "և".
export function forUppercase(text: string): string {
  return text.replace(/և/g, "ԵՎ");
}
