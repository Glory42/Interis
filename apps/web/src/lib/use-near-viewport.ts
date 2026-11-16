import { useCallback, useEffect, useState } from "react";

// True once the element has come within `margin` of the viewport, and stays true.
// Where IntersectionObserver is missing (jsdom, old browsers) it's true straight away.
export const useNearViewport = <T extends Element>(margin = "200px"): [(node: T | null) => void, boolean] => {
  const [node, setNode] = useState<T | null>(null);
  const [isNear, setIsNear] = useState(() => typeof IntersectionObserver === "undefined");
  const ref = useCallback((next: T | null) => setNode(next), []);

  useEffect(() => {
    if (isNear || !node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setIsNear(true);
      },
      { rootMargin: margin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isNear, node, margin]);

  return [ref, isNear];
};
