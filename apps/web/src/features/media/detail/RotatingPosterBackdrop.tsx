import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_INTERVAL_MS = 5000;

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type BackdropLayer = { id: number; url: string };

type RotatingPosterBackdropProps = {
  backdropUrls: string[];
  accentColor?: string;
  intervalMs?: number;
  className?: string;
};

// One large backdrop image behind a header/hero band, cycling slowly
// through the pool with a crossfade. Two stacked <img> layers: the older
// one just sits fully opaque, the newer one fades in on top of it
// (animate-poster-crossfade) - once the fade finishes the older layer is
// fully covered, so it's dropped on the next tick rather than needing its
// own fade-out. Scrimmed by a theme-adaptive gradient so title text on top
// always stays readable.
export const RotatingPosterBackdrop = ({
  backdropUrls,
  accentColor = "var(--foreground)",
  intervalMs = DEFAULT_INTERVAL_MS,
  className,
}: RotatingPosterBackdropProps) => {
  const indexRef = useRef(0);
  const layerIdRef = useRef(0);
  // Kept current without being a dependency of the rotation effect below,
  // so a parent re-render that hands down a new-but-equal array (a fresh
  // useMemo() result with the same URLs) can't restart its interval.
  const backdropUrlsRef = useRef(backdropUrls);
  useEffect(() => {
    backdropUrlsRef.current = backdropUrls;
  }, [backdropUrls]);

  // Lazy initializer only runs once per mount - the parent remounts this
  // component (via `key`) whenever the backdrop pool changes, rather than
  // syncing it here with an effect.
  const [layers, setLayers] = useState<BackdropLayer[]>(() =>
    backdropUrls.length > 0 ? [{ id: 0, url: backdropUrls[0] }] : [],
  );

  useEffect(() => {
    if (backdropUrlsRef.current.length < 2 || prefersReducedMotion()) {
      return;
    }

    const id = window.setInterval(() => {
      const urls = backdropUrlsRef.current;
      indexRef.current = (indexRef.current + 1) % urls.length;
      layerIdRef.current += 1;

      setLayers((prev) =>
        [...prev, { id: layerIdRef.current, url: urls[indexRef.current] }].slice(-2),
      );
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs]);

  if (layers.length === 0) {
    return null;
  }

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {layers.map((layer, i) => (
        <img
          key={layer.id}
          src={layer.url}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            i > 0 && "animate-poster-crossfade",
          )}
        />
      ))}

      <div className="absolute inset-0 bg-background/35" />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 10%, transparent) 0%, transparent 45%, color-mix(in srgb, var(--background) 88%, transparent) 100%)`,
        }}
      />
    </div>
  );
};
