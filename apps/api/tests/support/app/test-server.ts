import { createApp, type CreateAppOptions } from "../../../src/index";

export type RunningTestServer = {
  baseUrl: string;
  close: () => Promise<void>;
};

export const startTestServer = async (
  options?: CreateAppOptions,
): Promise<RunningTestServer> => {
  const app = createApp(options);
  const server = Bun.serve({ fetch: app.fetch, port: 0 });

  return {
    baseUrl: server.url.origin,
    close: async () => {
      await server.stop(true);
    },
  };
};
