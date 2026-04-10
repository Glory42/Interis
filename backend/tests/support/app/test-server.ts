import type { Server } from "node:http";
import { createApp } from "../../../src/index";

export type RunningTestServer = {
  baseUrl: string;
  close: () => Promise<void>;
};

const resolveBaseUrl = (server: Server): string => {
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not resolve test server address");
  }

  return `http://127.0.0.1:${address.port}`;
};

export const startTestServer = async (): Promise<RunningTestServer> => {
  const app = createApp();

  const server = await new Promise<Server>((resolve, reject) => {
    const createdServer = app.listen(0, () => {
      resolve(createdServer);
    });

    createdServer.on("error", reject);
  });

  const baseUrl = resolveBaseUrl(server);

  return {
    baseUrl,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
  };
};
