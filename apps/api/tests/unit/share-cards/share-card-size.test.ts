import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import jpeg from "jpeg-js";
import {
  renderListCard,
  renderMediaCard,
  renderProfileCard,
  renderRecapCard,
  renderReviewCard,
  type ShareCard,
} from "../../../src/infrastructure/share-cards";

// WhatsApp and some other unfurlers skip images much over ~600 KB; cards stay well under.
const CARD_BYTE_BUDGET = 300 * 1024;

// Busy, noisy stand-ins for TMDB artwork, a little heavier than real posters (~50 KB at
// w342) and backdrops (~105 KB at w780), so the budget holds for photographic cards.
const syntheticJpeg = (width: number, height: number, seed: number): Buffer => {
  const data = Buffer.alloc(width * height * 4);
  let state = seed;
  const random = () => (state = (state * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const base = 128 + 70 * Math.sin(x / 23 + seed) * Math.cos(y / 31);
      for (let channel = 0; channel < 3; channel += 1) {
        const value = base + (channel - 1) * 30 * Math.sin(y / 17) + (random() - 0.5) * 30;
        data[index + channel] = Math.max(0, Math.min(255, value));
      }
      data[index + 3] = 255;
    }
  }
  return Buffer.from(jpeg.encode({ data, width, height }, 85).data);
};

const poster = (n: number) => `https://image.tmdb.org/t/p/w342/size-test-poster-${n}.jpg`;
const BACKDROP = "https://image.tmdb.org/t/p/w780/size-test-backdrop.jpg";
const POSTERS = [1, 2, 3, 4, 5].map(poster);
const [FIRST_POSTER, SECOND_POSTER] = POSTERS as [string, string];

describe("share card size", () => {
  const realFetch = globalThis.fetch;

  beforeAll(() => {
    const images = new Map<string, Buffer>([
      ...POSTERS.map((url, index) => [url, syntheticJpeg(342, 513, index + 1)] as const),
      [BACKDROP, syntheticJpeg(780, 439, 99)],
    ]);
    globalThis.fetch = (async (input: string | URL | Request) => {
      const body = images.get(String(input instanceof Request ? input.url : input));
      return body
        ? new Response(new Uint8Array(body), { headers: { "content-type": "image/jpeg" } })
        : new Response(null, { status: 404 });
    }) as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = realFetch;
  });

  const cases: [string, () => Promise<ShareCard>][] = [
    ["film", () => renderMediaCard({
      mediaKind: "film",
      title: "A Long Film Title That Wraps Onto Two Lines",
      year: 2010,
      credit: "Directed by Ada Lens",
      genres: ["Drama", "Science Fiction", "Thriller"],
      overview: "A thief who steals secrets from deep inside the subconscious is offered one last job. ".repeat(3),
      communityRating: 8.7,
      posterUrl: FIRST_POSTER,
      backdropUrl: BACKDROP,
    })],
    ["series", () => renderMediaCard({
      mediaKind: "series",
      title: "A Series",
      year: 2019,
      credit: "Created by Bo Frame",
      genres: ["Drama"],
      overview: "Four seasons of slow-burning family drama.",
      communityRating: 7.4,
      posterUrl: SECOND_POSTER,
      backdropUrl: BACKDROP,
    })],
    ["review", () => renderReviewCard({
      mediaKind: "film",
      mediaTitle: "A Long Film Title",
      year: 2010,
      posterUrl: FIRST_POSTER,
      backdropUrl: BACKDROP,
      rating: 9,
      content: "A dream inside a heist inside a love story, and the ending still starts arguments. ".repeat(3),
      containsSpoilers: false,
      authorName: "Reviewer",
      authorUsername: "reviewer",
      authorAvatarUrl: null,
    })],
    ["list", () => renderListCard({
      title: "Films that bend your mind",
      isRanked: true,
      entryCount: 24,
      posterUrls: POSTERS,
      ownerName: "Curator",
      ownerUsername: "curator",
      ownerAvatarUrl: null,
    })],
    ["profile", () => renderProfileCard({
      displayName: "Watcher",
      username: "watcher",
      avatarUrl: null,
      bio: "Films, mostly at night.",
      stats: [{ label: "Film logs", value: 412 }, { label: "Reviews", value: 61 }],
      favoritePosterUrls: POSTERS.slice(0, 4),
    })],
    ["recap", () => renderRecapCard({
      displayName: "Watcher",
      username: "watcher",
      avatarUrl: null,
      year: 2025,
      isPartialYear: false,
      stats: [{ label: "Films", value: 142 }, { label: "Series", value: 18 }, { label: "Hours", value: 351 }],
      highlight: { label: "Top director", value: "Ada Lens" },
      posterUrls: POSTERS.slice(0, 4),
    })],
  ];

  for (const [kind, render] of cases) {
    it(`renders a ${kind} card with full artwork as a JPEG under ${CARD_BYTE_BUDGET / 1024} KB`, async () => {
      const card = await render();
      expect(card.complete).toBe(true);
      expect([...card.image.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
      expect(card.image.length).toBeLessThan(CARD_BYTE_BUDGET);
    });
  }
});
