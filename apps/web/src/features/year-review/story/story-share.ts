import { shareCardUrl } from "@/lib/share-meta";

export type StoryShareResult = "shared" | "downloaded" | "failed";

export const storyCardUrl = (username: string, year: number) =>
  shareCardUrl("recap-story", `${username}/${year}`);

type StoryShareInput = {
  username: string;
  year: number;
  title: string;
};

// Native file share on phones; a JPEG download plus the deep link on desktop.
export const shareStoryCard = async ({
  username,
  year,
  title,
}: StoryShareInput): Promise<StoryShareResult> => {
  const pageUrl = new URL(
    `/recap/${encodeURIComponent(username)}/${year}`,
    window.location.origin,
  ).toString();

  try {
    const response = await fetch(storyCardUrl(username, year));
    if (!response.ok) throw new Error("Story card render failed");
    const blob = await response.blob();
    const file = new File([blob], `interis-${year}-recap.jpg`, {
      type: blob.type || "image/jpeg",
    });

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title,
        text: "My year in review on Interis.",
        url: pageUrl,
      });
      return "shared";
    }

    if (typeof URL.createObjectURL === "function") {
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = file.name;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    }
    await navigator.clipboard?.writeText(pageUrl);
    return "downloaded";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "shared";
    try {
      await navigator.clipboard?.writeText(pageUrl);
    } catch {
      // No clipboard permission; the link is still in the address bar.
    }
    return "failed";
  }
};
