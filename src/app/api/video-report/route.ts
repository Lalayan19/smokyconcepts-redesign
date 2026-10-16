// Where the home page's videos (see src/lib/videoReport.ts) say that one did not play on a
// visitor's device. It does one thing: writes the note to the server's log (`docker logs
// smokyconcepts-frontend`), one line each, starting with [video-report]. Nothing is stored and
// nothing is answered but "no content".
export const dynamic = "force-dynamic";

const MAX_BYTES = 2000;

export async function POST(request: Request) {
  try {
    const text = (await request.text()).slice(0, MAX_BYTES);
    // Only a note that is JSON is written (the page sends one), on a single line.
    const note = JSON.parse(text);
    if (note && typeof note === "object") {
      console.log("[video-report]", JSON.stringify(note));
    }
  } catch {
    // Not a note: ignored.
  }
  return new Response(null, { status: 204 });
}
