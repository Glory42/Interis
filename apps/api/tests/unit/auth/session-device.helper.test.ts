import { describe, expect, it } from "bun:test";
import { describeUserAgent, maskIpAddress } from "../../../src/modules/auth/helpers/session-device.helper";

describe("describeUserAgent", () => {
  it.each([
    ["Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0", "Firefox on Linux"],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
      "Safari on iPhone",
    ],
    [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
      "Safari on macOS",
    ],
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Chrome on Windows",
    ],
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
      "Edge on Windows",
    ],
    [
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      "Chrome on Android",
    ],
    [
      "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36",
      "Samsung Internet on Android",
    ],
    [
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1",
      "Chrome on iPad",
    ],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/133.0 Mobile/15E148 Safari/605.1.15",
      "Firefox on iPhone",
    ],
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 OPR/115.0.0.0",
      "Opera on Windows",
    ],
    [
      "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Chrome on ChromeOS",
    ],
  ])("names %s", (userAgent, label) => {
    expect(describeUserAgent(userAgent)).toBe(label);
  });

  it("falls back when the browser or the whole agent is unknown", () => {
    expect(describeUserAgent("SomeApp/1.0 (Linux)")).toBe("Browser on Linux");
    expect(describeUserAgent("curl/8.5.0")).toBe("Unknown device");
    expect(describeUserAgent("")).toBe("Unknown device");
    expect(describeUserAgent(null)).toBe("Unknown device");
  });
});

describe("maskIpAddress", () => {
  it("keeps only the network part of public addresses", () => {
    expect(maskIpAddress("203.0.113.42")).toBe("203.0.113.*");
    expect(maskIpAddress("::ffff:203.0.113.42")).toBe("203.0.113.*");
    expect(maskIpAddress("2001:db8:85a3:8d3:1319:8a2e:370:7348")).toBe("2001:db8:85a3:*");
    expect(maskIpAddress("2001:db8::1")).toBe("2001:db8:*");
  });

  it("hides private, loopback and malformed addresses", () => {
    for (const ip of ["10.0.0.5", "172.20.1.1", "192.168.1.10", "127.0.0.1", "::1", "::ffff:127.0.0.1", "fd00::1", "fe80::1", "999.1.1.1", "nonsense", "", null]) {
      expect(maskIpAddress(ip)).toBeNull();
    }
  });
});
