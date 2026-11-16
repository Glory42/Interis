// https://www.cloudflare.com/ips-v4 and /ips-v6, as published 2026-11-16.
export const CLOUDFLARE_IP_RANGES = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
];

export const DEFAULT_TRUST_PROXY = "cloudflare";

export type TrustProxySetting = false | number | string[];

/**
 * Turns TRUST_PROXY into Express's `trust proxy` value.
 * - "cloudflare" (default): Client → Cloudflare → Render's load balancer → app.
 *   Trusts the private-network hop (Render's proxy) and Cloudflare's ranges only, so
 *   Express walks X-Forwarded-For from the right and stops at the first other
 *   address: a client-written leftmost entry is never taken as req.ip.
 * - "none" / "false": no proxy, req.ip is the socket peer.
 * - a whole number: that many hops (only safe when every request crosses them all).
 * - anything else: a comma-separated list of addresses, CIDRs or proxy-addr names.
 * "true" is refused: it would make req.ip whatever the client writes first.
 */
export const resolveTrustProxy = (raw: string): TrustProxySetting => {
  const value = raw.trim().toLowerCase();

  if (value === "cloudflare") {
    return ["loopback", "linklocal", "uniquelocal", ...CLOUDFLARE_IP_RANGES];
  }
  if (value === "none" || value === "false" || value === "0") {
    return false;
  }
  if (value === "true") {
    throw new Error("TRUST_PROXY=true would let any client choose its own IP; use a hop count or an address list");
  }
  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  const entries = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  if (entries.length === 0) {
    throw new Error("TRUST_PROXY is empty");
  }
  return entries;
};
