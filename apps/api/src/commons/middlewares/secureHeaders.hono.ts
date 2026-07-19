import { secureHeaders } from "hono/secure-headers";

// Pure JSON API, no server-rendered HTML/JS/assets — CSP can be maximally
// restrictive since nothing returned is ever meant to be loaded as a
// document, script, or embedded frame.
export const secureHeadersMiddleware = secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'none'"],
    baseUri: ["'none'"],
    fontSrc: ["'self'", "https:", "data:"],
    formAction: ["'none'"],
    frameAncestors: ["'none'"],
    imgSrc: ["'self'", "data:"],
    objectSrc: ["'none'"],
    scriptSrc: ["'self'"],
    scriptSrcAttr: ["'none'"],
    styleSrc: ["'self'", "https:", "'unsafe-inline'"],
    upgradeInsecureRequests: [],
  },
  xFrameOptions: "DENY",
  referrerPolicy: "strict-origin-when-cross-origin",
  strictTransportSecurity: "max-age=31536000; includeSubDomains",
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
  },
});
