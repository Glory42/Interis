// The deployed Interis API (Render, behind Cloudflare) - the same backend the
// web app talks to. The mobile app uses it by default, so running the app
// needs no local backend.
const PRODUCTION_API_BASE_URL = "https://api.interis.gorkemkaryol.dev";

// Set EXPO_PUBLIC_API_BASE_URL (e.g. in .env.local) to point at another
// server, such as a local API: http://<your-LAN-IP>:5000
const resolveApiBaseUrl = (): string => {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  return (explicit || PRODUCTION_API_BASE_URL).replace(/\/$/, "");
};

export const API_BASE_URL = resolveApiBaseUrl();
