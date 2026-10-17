import Link from "next/link";

import ScrollVideo from "@/components/ScrollVideo";
import { ATELIER_MOBILE_VIDEO, ATELIER_SILVER_VIDEO, ATELIER_VIDEO } from "@/lib/homeVideos";

// How long the two videos take to catch up with the scroll (a little, not much: the
// other video of the home page, in Personalization, takes 120).
const ATELIER_GLIDE_MS = 50;
// How many frames each video has (2 seconds at 24 a second): the video is only asked to
// jump when the frame it should show changes (see ScrollVideo), not at every pixel of
// scroll, which kept a phone busy decoding the same picture again and again.
const ATELIER_FRAMES = 48;
// How the two videos play (see ScrollVideo): no hold. The first frames of the files are
// white (the case is not in yet) or the case is still sliding in; the videos now start from
// frame 16 of the 48, the dark case as it stands in the reference picture, and have played to
// their last frame exactly when the section is in the middle of the window (rampEnd 0).
// They start when the top of the section is this share of the window's height further down
// than that. The speed is what it was (0.321 of the window's height for the 48 frames), so
// the 32 frames that are left take 0.321 * 32 / 48 = 0.214. Scrolling back up they play
// backwards at once.
const ATELIER_FIRST_FRAME = 16;
const ATELIER_RAMP = 0.214;
const ATELIER_RAMP_END = 0;
// The phone's own video (see ATELIER_MOBILE_VIDEO): 48 frames (2 seconds at 24 a second), the
// case small and dark on the first and big and golden on the last, and all of them are played
// (from frame 0 to 47). It plays at the speed of the other Atelier videos (0.321 of the window's
// height of scroll for the 48 frames, 0.00669 a frame) and starts when the top of the section is
// 0.348 of the window's height further down than in the middle of the window: 20 frames of scroll
// earlier than it did (0.214, and before that 0.0802: each step 20 * 0.00669 = 0.134). It has
// played to its last frame 0.321 further on, 0.027 of the window's height before the middle.
const ATELIER_MOBILE_FRAMES = 48;
const ATELIER_MOBILE_RAMP = 0.348;
const ATELIER_MOBILE_RAMP_END = 0.027;

type AtelierSectionProps = {
  buttonHref: string;
};

export default function AtelierSection({ buttonHref }: AtelierSectionProps) {
  return (
    <section className="atelier-section bg-white relative left-1/2 flex h-[105vh] w-screen -mx-[50vw] flex-col bg-[#efefef] px-6 pt-[126px] pb-10 text-center">
      <Link href={buttonHref} className="atelier-link">
        <h2
          className="font-montserrat italic text-[#130F0F]"
          style={{ fontWeight: 800, fontSize: "66px", lineHeight: 1.1 }}
        >
          Atelier
        </h2>
        <p
          className="mx-auto max-w-md font-montserrat text-[#120F0F]"
          style={{ fontSize: "14px", fontWeight: "600" }}
        >
          Pack names are standard. Dimensions aren&rsquo;t. We make precise
          versions that match yours
        </p>

        <button
          // href={buttonHref}
          style={{
            letterSpacing: "0.1em",
            border: "1px solid #122A26",
            fontWeight: 500,
          }}
          className="mt-[48px] inline-flex h-[42px] w-[165px] items-center justify-center self-center rounded-[8px] bg-[#dcc090] text-[17px] font-montserrat text-[#122a26] transition-colors hover:bg-[#d3b57c]"
        >
          SEE DETAILS
        </button>

        {/* The case: a video, played by the scroll (see ScrollVideo and
            `.atelier-case-video` in globals.css), on every screen. */}
        <div className="atelier-case relative mx-auto mt-[54px] h-[315px] w-[203px]">
          <ScrollVideo
            src={ATELIER_VIDEO}
            sectionSelector=".atelier-section"
            windows="tabletUp"
            className="atelier-case-video atelier-case-video-left"
            frames={ATELIER_FRAMES}
            fallbackFolder="atelier"
            firstFrame={ATELIER_FIRST_FRAME}
            glideMs={ATELIER_GLIDE_MS}
            ramp={ATELIER_RAMP}
            rampEnd={ATELIER_RAMP_END}
          />
          {/* A phone plays its own video, in the same box (the one above is not shown
              on a phone, see `.atelier-case-video-mobile` in globals.css). */}
          <ScrollVideo
            src={ATELIER_MOBILE_VIDEO}
            sectionSelector=".atelier-section"
            windows="phone"
            className="atelier-case-video atelier-case-video-mobile"
            frames={ATELIER_MOBILE_FRAMES}
            fallbackFolder="atelier-mobile"
            glideMs={ATELIER_GLIDE_MS}
            ramp={ATELIER_MOBILE_RAMP}
            rampEnd={ATELIER_MOBILE_RAMP_END}
          />
        </div>

        {/* Tablet and up: the silver case, on the other side of the text (the box is
            not shown on a phone). */}
        <div aria-hidden="true" className="atelier-case-mirror relative hidden">
          <ScrollVideo
            src={ATELIER_SILVER_VIDEO}
            sectionSelector=".atelier-section"
            windows="tabletUp"
            className="atelier-case-video atelier-case-video-right"
            frames={ATELIER_FRAMES}
            fallbackFolder="atelier-silver"
            firstFrame={ATELIER_FIRST_FRAME}
            glideMs={ATELIER_GLIDE_MS}
            ramp={ATELIER_RAMP}
            rampEnd={ATELIER_RAMP_END}
          />
        </div>
      </Link>
    </section>
  );
}
