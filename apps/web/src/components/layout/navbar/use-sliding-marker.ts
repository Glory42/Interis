import { useLayoutEffect, useRef } from "react";

// Moves one marker element under the active item so it slides between items, like the profile tabs.
export const useSlidingMarker = <K extends string>(activeKey: K | null) => {
  const itemRefs = useRef(new Map<K, HTMLElement>());
  const markerRef = useRef<HTMLSpanElement>(null);
  const hasPlacedRef = useRef(false);

  useLayoutEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const element = activeKey ? itemRefs.current.get(activeKey) : undefined;
    // Off every section (a profile, settings) the marker fades out where it was.
    marker.style.opacity = element ? "1" : "0";
    if (!element) return;

    // The first placement jumps into position instead of sliding in from the left edge.
    if (!hasPlacedRef.current) marker.style.transition = "none";
    const place = () => {
      marker.style.transform = `translateX(${element.offsetLeft}px)`;
      marker.style.width = `${element.offsetWidth}px`;
    };
    place();
    if (!hasPlacedRef.current) {
      void marker.offsetWidth;
      marker.style.transition = "";
      hasPlacedRef.current = true;
    }
    // Web fonts can land after the first measure and change the link widths.
    let isCurrent = true;
    void document.fonts?.ready.then(() => {
      if (isCurrent) place();
    });
    return () => {
      isCurrent = false;
    };
  }, [activeKey]);

  const register = (key: K) => (element: HTMLElement | null) => {
    if (element) itemRefs.current.set(key, element);
    else itemRefs.current.delete(key);
  };

  return { markerRef, register };
};

export const isSectionActive = (pathname: string, to: string, exact = false): boolean =>
  exact || to === "/" ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
