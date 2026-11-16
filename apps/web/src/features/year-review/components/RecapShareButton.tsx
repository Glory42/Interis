import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recapPath } from "@/features/year-review/year-review-model";

type RecapShareButtonProps = { username: string; year: number; title: string };

const prefersNativeShare = () =>
  typeof navigator.share === "function" && (window.matchMedia?.("(pointer: coarse)").matches ?? false);

// The share sheet on phones (Web Share API), a copied link everywhere else.
export const RecapShareButton = ({ username, year, title }: RecapShareButtonProps) => {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const share = async () => {
    const url = new URL(recapPath(username, year), window.location.origin).toString();
    if (prefersNativeShare()) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Closing the sheet isn't a failure; anything else falls back to copying.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    window.setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <Button variant="secondary" size="md" onClick={() => void share()} aria-live="polite">
      {status === "copied" ? <Check aria-hidden className="size-3.5" /> : <Share2 aria-hidden className="size-3.5" />}
      {status === "copied" ? "Link copied" : status === "failed" ? "Couldn't copy" : "Share"}
    </Button>
  );
};
