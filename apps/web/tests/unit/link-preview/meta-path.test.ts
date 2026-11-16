import { describe, expect, it } from "vitest";
import { metaPathFor } from "../../../link-preview/meta-path";

const REVIEW_ID = "3f2c8a5e-1b2c-4d5e-8f90-123456789abc";

describe("metaPathFor", () => {
  it.each([
    [`/reviews/ana/${REVIEW_ID}`, `/review/ana/${REVIEW_ID}`],
    ["/profile/ana", "/profile/ana"],
    ["/profile/ana/diary", "/profile/ana"],
    ["/profile/ana/lists", "/profile/ana"],
    ["/profile/ana/lists/new", "/profile/ana"],
    [`/profile/ana/lists/${REVIEW_ID}`, `/list/${REVIEW_ID}`],
    ["/movies/27205", "/movie/27205"],
    ["/movies/27205/", "/movie/27205"],
    ["/serials/1399", "/serial/1399"],
    ["/serials/1399/season/0", "/serial/1399/season/0"],
    ["/actor/Keanu-Reeves", "/person/actor/keanu-reeves"],
    ["/director/greta-gerwig", "/person/director/greta-gerwig"],
    ["/profile/ana%20b", "/profile/ana%20b"],
  ])("maps %s to %s", (pathname, expected) => {
    expect(metaPathFor(pathname)).toBe(expected);
  });

  it.each([
    "/",
    "/movies",
    "/movies/abc",
    "/movies/0",
    "/serials/1399/episodes",
    "/reviews/ana/not-a-uuid",
    "/reviews/ana",
    "/actor/bad_slug!",
    "/settings",
    "/profile/%E0%A4%A",
    "/assets/index.js",
  ])("ignores %s", (pathname) => {
    expect(metaPathFor(pathname)).toBeNull();
  });
});
