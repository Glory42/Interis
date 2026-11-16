import { afterEach, describe, expect, it, vi } from "vitest";
import { readPushDeviceState } from "@/features/push/push-device";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

const stubPushSupport = (permission: NotificationPermission, subscription: { endpoint: string } | null) => {
  vi.stubGlobal("PushManager", class {});
  vi.stubGlobal("Notification", { permission });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { getRegistration: async () => ({ pushManager: { getSubscription: async () => subscription } }) },
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "serviceWorker");
});

describe("readPushDeviceState", () => {
  it("tells iOS Safari users to install the app first", async () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(IPHONE_UA);
    expect(await readPushDeviceState()).toEqual({ kind: "needs-install" });
  });

  it("calls a browser without Web Push unsupported", async () => {
    expect(await readPushDeviceState()).toEqual({ kind: "unsupported" });
  });

  it("reports blocked, off and on", async () => {
    stubPushSupport("denied", null);
    expect(await readPushDeviceState()).toEqual({ kind: "blocked" });

    stubPushSupport("default", null);
    expect(await readPushDeviceState()).toEqual({ kind: "off" });

    stubPushSupport("granted", { endpoint: "https://push.example/1" });
    expect(await readPushDeviceState()).toEqual({ kind: "on", endpoint: "https://push.example/1" });
  });
});
