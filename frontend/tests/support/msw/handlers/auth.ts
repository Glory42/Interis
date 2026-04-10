import { http, HttpResponse } from "msw";

export const authHandlers = [
  http.post("*/api/auth/sign-in/email", async () => {
    return HttpResponse.json({ ok: true });
  }),
  http.post("*/api/auth/sign-up/email", async () => {
    return HttpResponse.json({ ok: true });
  }),
  http.post("*/api/auth/sign-out", async () => {
    return HttpResponse.json({ ok: true });
  }),
  http.post("*/api/auth/change-password", async () => {
    return HttpResponse.json({ ok: true });
  }),
  http.post("*/api/auth/change-email", async () => {
    return HttpResponse.json({ ok: true });
  }),
  http.post("*/api/auth/update-user", async () => {
    return HttpResponse.json({ ok: true });
  }),
];
