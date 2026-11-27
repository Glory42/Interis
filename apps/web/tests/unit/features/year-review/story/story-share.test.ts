import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shareStoryCard, storyCardUrl } from "../../../../../src/features/year-review/story/story-share";

const cardFetch = () =>
  vi.fn(async () =>
    new Response(new Blob(["jpeg"], { type: "image/jpeg" }), {
      status: 200,
      headers: { "content-type": "image/jpeg" },
    }),
  );

const setNavigator = (values: Record<string, unknown>) => {
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(navigator, key, { configurable: true, value });
  }
};

describe("shareStoryCard", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", cardFetch());
    setNavigator({
      clipboard: { writeText: vi.fn(async () => undefined) },
      canShare: undefined,
      share: undefined,
    });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:card"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    for (const key of ["clipboard", "canShare", "share"]) {
      Reflect.deleteProperty(navigator, key);
    }
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  it("uses the 1080×1920 story card URL", () => {
    expect(storyCardUrl("glory42", 2025)).toMatch(/\/api\/public\/og\/recap-story\/glory42\/2025\.jpg$/);
  });

  it("shares the card file natively when the browser supports it", async () => {
    const share = vi.fn(async () => undefined);
    setNavigator({ canShare: () => true, share });

    const result = await shareStoryCard({ username: "glory42", year: 2025, title: "My recap" });

    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledTimes(1);
    const payload = share.mock.calls[0]![0] as { files: File[]; url: string };
    expect(payload.files[0]!.name).toBe("interis-2025-recap.jpg");
    expect(payload.url).toBe("http://localhost:3000/recap/glory42/2025");
  });

  it("downloads the card and copies the link when native file share is unavailable", async () => {
    const writeText = vi.fn(async () => undefined);
    setNavigator({ clipboard: { writeText } });

    const result = await shareStoryCard({ username: "glory42", year: 2025, title: "My recap" });

    expect(result).toBe("downloaded");
    expect(writeText).toHaveBeenCalledWith("http://localhost:3000/recap/glory42/2025");
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
  });

  it("falls back to the link when the card render fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 500 })));
    const writeText = vi.fn(async () => undefined);
    setNavigator({ clipboard: { writeText } });

    const result = await shareStoryCard({ username: "glory42", year: 2025, title: "My recap" });

    expect(result).toBe("failed");
    expect(writeText).toHaveBeenCalledWith("http://localhost:3000/recap/glory42/2025");
  });
});
