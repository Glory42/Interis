import type { IncomingHttpHeaders } from "node:http";

export type ClientKind = "crawler" | "spoofed-browser" | "browser";

// Most crawlers announce themselves as "(compatible; Xbot/1.0; ...)"; the rest are listed by name.
const CRAWLER_UA_PATTERN =
  /compatible;[^)]*(?:bot|crawler|spider)|applebot|facebookexternalhit|meta-externalagent|headlesschrome/i;

const readHeader = (headers: IncomingHttpHeaders, name: string): string => {
  const value = headers[name];
  return (Array.isArray(value) ? value[0] : value) ?? "";
};

const platformFromUserAgent = (userAgent: string): string | null => {
  if (/Windows NT/.test(userAgent)) return "Windows";
  if (/Android/.test(userAgent)) return "Android";
  if (/CrOS/.test(userAgent)) return "Chrome OS";
  if (/Macintosh/.test(userAgent)) return "macOS";
  if (/Linux/.test(userAgent)) return "Linux";
  return null;
};

// Real Chromium browsers send client hints that agree with their user agent;
// headless scrapers that fake a desktop user agent usually forget to (2026-11 AWS scraper).
const hasMismatchedClientHints = (headers: IncomingHttpHeaders, userAgent: string): boolean => {
  const hintedPlatform = readHeader(headers, "sec-ch-ua-platform").replaceAll('"', "");
  const claimedPlatform = platformFromUserAgent(userAgent);
  if (hintedPlatform && claimedPlatform && hintedPlatform !== claimedPlatform) {
    // Chrome's "request desktop site" on Android/ChromeOS sends a Linux user agent.
    const isDesktopModeLinux =
      claimedPlatform === "Linux" && (hintedPlatform === "Android" || hintedPlatform === "Chrome OS");
    if (!isDesktopModeLinux) return true;
  }

  const claimedChromeMajor = /Chrome\/(\d+)/.exec(userAgent)?.[1];
  const hintedChromeMajor = /"Chromium";v="(\d+)"/.exec(readHeader(headers, "sec-ch-ua"))?.[1];
  return Boolean(claimedChromeMajor && hintedChromeMajor && claimedChromeMajor !== hintedChromeMajor);
};

export const classifyClient = (headers: IncomingHttpHeaders): ClientKind => {
  const userAgent = readHeader(headers, "user-agent");
  if (CRAWLER_UA_PATTERN.test(userAgent)) return "crawler";
  if (hasMismatchedClientHints(headers, userAgent)) return "spoofed-browser";
  return "browser";
};
