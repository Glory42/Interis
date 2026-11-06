import { Slate } from "@/components/film/Slate";

type LetterboxHeroProps = {
  backdropUrl: string | null;
  // Top slate: "Interis · Film · 2026" | "1h 49m · English · USA".
  slateLeft: string[];
  slateRight: string[];
};

// The title's own still, kept in full colour, framed by slate bars like a letterbox.
export const LetterboxHero = ({ backdropUrl, slateLeft, slateRight }: LetterboxHeroProps) => (
  <div className="w-full bg-[color:var(--slate)]">
    <Slate left={slateLeft} right={slateRight} className="mx-auto max-w-5xl" />
    <div className="relative h-[38vh] max-h-120 min-h-64 w-full overflow-hidden">
      {backdropUrl ? (
        <img src={backdropUrl} alt="" aria-hidden className="h-full w-full object-cover" />
      ) : null}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-[color:var(--slate)] to-transparent" />
    </div>
    <div aria-hidden className="h-6 bg-[color:var(--slate)]" />
  </div>
);
