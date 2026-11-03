import { describe, expect, it } from "bun:test";
import { classifyClient } from "../../../src/commons/http/crawler-detection.helper";

const GOOGLEBOT_SMARTPHONE =
  "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.52 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const MAC_CHROME_142 =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";
const LINUX_CHROME_156 =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36";
const chromium = (version: number) =>
  `"Google Chrome";v="${version}", "Not_A Brand";v="8", "Chromium";v="${version}"`;

describe("classifyClient", () => {
  it.each([
    GOOGLEBOT_SMARTPHONE,
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.1; +https://openai.com/gptbot)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.0.0 Safari/537.36",
  ])("flags self-identified crawler %#", (userAgent) => {
    expect(classifyClient({ "user-agent": userAgent })).toBe("crawler");
  });

  it("flags a desktop Mac user agent whose client hints say Linux (headless scraper)", () => {
    expect(
      classifyClient({
        "user-agent": MAC_CHROME_142,
        "sec-ch-ua": chromium(142),
        "sec-ch-ua-platform": '"Linux"',
      }),
    ).toBe("spoofed-browser");
  });

  it("flags a Chrome version that disagrees with the Chromium client hint", () => {
    expect(
      classifyClient({
        "user-agent": LINUX_CHROME_156.replace("156", "142"),
        "sec-ch-ua": chromium(156),
        "sec-ch-ua-platform": '"Linux"',
      }),
    ).toBe("spoofed-browser");
  });

  it("accepts a real Chrome whose client hints match its user agent", () => {
    expect(
      classifyClient({
        "user-agent": LINUX_CHROME_156,
        "sec-ch-ua": chromium(156),
        "sec-ch-ua-platform": '"Linux"',
      }),
    ).toBe("browser");
  });

  it("accepts Chrome's request-desktop-site mode on Android (Linux UA, Android hint)", () => {
    expect(
      classifyClient({
        "user-agent": LINUX_CHROME_156,
        "sec-ch-ua": chromium(156),
        "sec-ch-ua-platform": '"Android"',
      }),
    ).toBe("browser");
  });

  it("accepts browsers that send no client hints (Safari, Firefox)", () => {
    expect(
      classifyClient({
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:140.0) Gecko/20100101 Firefox/140.0",
      }),
    ).toBe("browser");
  });

  it("does not mistake a CUBOT phone model for a crawler", () => {
    expect(
      classifyClient({
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10; CUBOT X30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36",
      }),
    ).toBe("browser");
  });

  it("treats a missing user agent as a browser", () => {
    expect(classifyClient({})).toBe("browser");
  });
});
