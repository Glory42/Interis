import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { SettingsNotificationsSection } from "@/features/settings/components/sections/SettingsNotificationsSection";
import {
  PushPermissionError,
  readPushDeviceState,
  subscribeThisDevice,
  unsubscribeThisDevice,
  type PushDeviceState,
} from "@/features/push/push-device";

vi.mock("@/features/push/push-device", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/push/push-device")>();
  return {
    ...actual,
    readPushDeviceState: vi.fn(),
    subscribeThisDevice: vi.fn(),
    unsubscribeThisDevice: vi.fn(),
  };
});

const PUBLIC_KEY = "BPublicKeyForTests";
const ENDPOINT = "https://fcm.googleapis.com/fcm/send/device-1";
const PREFERENCES = { follows: true, likes: true, comments: true, moderation: true };

const serve = (options: { enabled?: boolean } = {}) => {
  const calls = { subscribed: [] as unknown[], removed: [] as unknown[], preferences: [] as unknown[] };
  const enabled = options.enabled ?? true;
  server.use(
    http.get("*/api/push/public-key", () =>
      HttpResponse.json({ enabled, publicKey: enabled ? PUBLIC_KEY : null }),
    ),
    http.get("*/api/push/preferences", () => HttpResponse.json(PREFERENCES)),
    http.put("*/api/push/preferences", async ({ request }) => {
      const body = (await request.json()) as Record<string, boolean>;
      calls.preferences.push(body);
      return HttpResponse.json({ ...PREFERENCES, ...body });
    }),
    http.post("*/api/push/subscriptions", async ({ request }) => {
      calls.subscribed.push(await request.json());
      return HttpResponse.json({ success: true });
    }),
    http.delete("*/api/push/subscriptions", async ({ request }) => {
      calls.removed.push(await request.json());
      return HttpResponse.json({ success: true });
    }),
  );
  return calls;
};

const onDevice = (state: PushDeviceState) => vi.mocked(readPushDeviceState).mockResolvedValue(state);
const deviceSwitch = () => screen.findByRole("switch", { name: "Push notifications on this device" });

beforeEach(() => {
  vi.mocked(subscribeThisDevice).mockReset();
  vi.mocked(unsubscribeThisDevice).mockReset();
});

describe("push notifications on this device", () => {
  it("hides the toggle when the server has push turned off", async () => {
    serve({ enabled: false });
    onDevice({ kind: "off" });
    renderWithProviders(<SettingsNotificationsSection />);

    expect(await screen.findByText("Push notifications aren't available right now.")).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("asks for permission only when turned on, then saves the subscription", async () => {
    const user = userEvent.setup();
    const calls = serve();
    onDevice({ kind: "off" });
    vi.mocked(subscribeThisDevice).mockResolvedValue({ endpoint: ENDPOINT, keys: { p256dh: "p", auth: "a" } });
    renderWithProviders(<SettingsNotificationsSection />);

    const toggle = await deviceSwitch();
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(subscribeThisDevice).not.toHaveBeenCalled();

    await user.click(toggle);

    expect(subscribeThisDevice).toHaveBeenCalledWith(PUBLIC_KEY);
    await vi.waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "true"));
    expect(calls.subscribed).toEqual([{ endpoint: ENDPOINT, keys: { p256dh: "p", auth: "a" } }]);
  });

  it("turns off and removes the server's copy", async () => {
    const user = userEvent.setup();
    const calls = serve();
    onDevice({ kind: "on", endpoint: ENDPOINT });
    vi.mocked(unsubscribeThisDevice).mockResolvedValue(ENDPOINT);
    renderWithProviders(<SettingsNotificationsSection />);

    const toggle = await deviceSwitch();
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await user.click(toggle);

    await vi.waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "false"));
    expect(calls.removed).toEqual([{ endpoint: ENDPOINT }]);
  });

  it("explains a dismissed permission prompt", async () => {
    const user = userEvent.setup();
    serve();
    onDevice({ kind: "off" });
    vi.mocked(subscribeThisDevice).mockRejectedValue(new PushPermissionError("default"));
    renderWithProviders(<SettingsNotificationsSection />);

    await user.click(await deviceSwitch());

    expect(await screen.findByRole("alert")).toHaveTextContent("You didn't allow notifications");
  });

  it.each([
    [{ kind: "blocked" } as const, /blocked for this site/],
    [{ kind: "needs-install" } as const, /Add to Home Screen/],
    [{ kind: "unsupported" } as const, /can't receive push notifications/],
  ])("shows %o without a toggle", async (state, note) => {
    serve();
    onDevice(state);
    renderWithProviders(<SettingsNotificationsSection />);

    expect(await screen.findByText(note)).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Push notifications on this device" })).not.toBeInTheDocument();
  });

  it("saves a category change", async () => {
    const user = userEvent.setup();
    const calls = serve();
    onDevice({ kind: "on", endpoint: ENDPOINT });
    renderWithProviders(<SettingsNotificationsSection />);

    const likes = await screen.findByRole("switch", { name: "Likes" });
    await user.click(likes);

    await vi.waitFor(() => expect(likes).toHaveAttribute("aria-checked", "false"));
    expect(calls.preferences).toEqual([{ likes: false }]);
  });
});
