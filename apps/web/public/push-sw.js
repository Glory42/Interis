// Web Push handlers, pulled into the generated service worker via workbox.importScripts.
// Message types are mirrored in src/features/push/push-messages.ts.
const PUSH_RECEIVED = "interis:push-received";
const PUSH_OPEN_URL = "interis:push-open-url";

const toAppPath = (value) =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";

const appWindows = () =>
  self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => clients.filter((client) => new URL(client.url).origin === self.location.origin));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const tag = typeof data.tag === "string" ? data.tag : undefined;
  const shown = self.registration.showNotification(typeof data.title === "string" ? data.title : "Interis", {
    body: typeof data.body === "string" ? data.body : "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag,
    renotify: Boolean(tag),
    data: { url: toAppPath(data.url) },
  });
  // Open tabs refresh the bell instead of polling for it.
  const told = appWindows().then((clients) => {
    for (const client of clients) client.postMessage({ type: PUSH_RECEIVED });
  });

  event.waitUntil(Promise.all([shown, told]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = toAppPath(event.notification.data && event.notification.data.url);

  event.waitUntil(
    appWindows().then(async (clients) => {
      const open = clients.find((client) => client.focused) || clients[0];
      if (open) {
        await open.focus();
        open.postMessage({ type: PUSH_OPEN_URL, url });
        return;
      }
      await self.clients.openWindow(url);
    }),
  );
});
