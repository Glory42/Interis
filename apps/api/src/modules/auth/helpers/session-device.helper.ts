// Small hand-rolled user-agent parsing: only the browser and OS families we
// want to name in Settings, checked most specific first (Edge says "Chrome" too).
const BROWSERS: Array<[RegExp, string]> = [
  [/\bEdg(?:e|A|iOS)?\//, "Edge"],
  [/\b(?:OPR|Opera)\//, "Opera"],
  [/\bSamsungBrowser\//, "Samsung Internet"],
  [/\bVivaldi\//, "Vivaldi"],
  [/\b(?:Firefox|FxiOS)\//, "Firefox"],
  [/\b(?:Chrome|CriOS|Chromium)\//, "Chrome"],
  [/\bVersion\/[\d.]+.*\bSafari\//, "Safari"],
];

const OPERATING_SYSTEMS: Array<[RegExp, string]> = [
  [/\biPhone\b/, "iPhone"],
  [/\biPad\b/, "iPad"],
  [/\bAndroid\b/, "Android"],
  [/\bWindows\b/, "Windows"],
  [/\bCrOS\b/, "ChromeOS"],
  [/\bMacintosh\b|\bMac OS X\b/, "macOS"],
  [/\bLinux\b/, "Linux"],
];

const firstMatch = (value: string, patterns: Array<[RegExp, string]>): string | null =>
  patterns.find(([pattern]) => pattern.test(value))?.[1] ?? null;

export const describeUserAgent = (userAgent: string | null | undefined): string => {
  if (!userAgent) return "Unknown device";

  const browser = firstMatch(userAgent, BROWSERS);
  const os = firstMatch(userAgent, OPERATING_SYSTEMS);
  if (browser && os) return `${browser} on ${os}`;
  return browser ?? (os ? `Browser on ${os}` : "Unknown device");
};

const isPrivateIpv4 = (a: number, b: number): boolean =>
  a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);

// Keeps the network part only (/24 for IPv4, /48 for IPv6). Private and
// loopback addresses come from a proxy, not the device, so they're hidden.
export const maskIpAddress = (ipAddress: string | null | undefined): string | null => {
  if (!ipAddress) return null;
  const ip = ipAddress.trim().replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/i, "");

  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const octets = v4.slice(1, 5).map(Number);
    if (octets.some((octet) => octet > 255) || isPrivateIpv4(octets[0] ?? 0, octets[1] ?? 0)) return null;
    return `${octets.slice(0, 3).join(".")}.*`;
  }

  if (!ip.includes(":")) return null;
  const lower = ip.toLowerCase();
  if (lower === "::1" || /^f[cd]|^fe[89ab]/.test(lower)) return null;
  const groups = (lower.split("::")[0] ?? "").split(":").filter(Boolean);
  if (groups.length === 0) return null;
  return `${groups.slice(0, 3).join(":")}:*`;
};
