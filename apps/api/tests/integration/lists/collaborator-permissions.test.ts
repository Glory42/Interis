import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { signUpTestUser, type SignedUpTestUser } from "../../support/app/auth-flow";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { seedTestFilm } from "../../support/factories/media.factory";
import {
  createListViaApi,
  jsonRequest,
  seedCollaborator,
  seedListEntries,
  userIdOf,
} from "../../support/factories/list.factory";

type Role = "owner" | "collaborator" | "invitee" | "stranger";
type Fixture = { listId: string; entryIds: string[]; bystanderId: string; newFilmTmdbId: number };
type Endpoint = {
  name: string;
  request: (f: Fixture) => { method: string; path: string; body?: unknown };
  expected: Record<Role, number>;
};

const entryEditors = (status: number) => ({ owner: status, collaborator: status, invitee: 403, stranger: 403 });
const ownerOnly = (status: number) => ({ owner: status, collaborator: 403, invitee: 403, stranger: 403 });

// Every List write endpoint, and which roles may call it.
const ENDPOINTS: Endpoint[] = [
  {
    name: "update list settings",
    request: (f) => ({ method: "PATCH", path: `/api/lists/${f.listId}`, body: { title: "Renamed", isPublic: true } }),
    expected: ownerOnly(200),
  },
  { name: "delete list", request: (f) => ({ method: "DELETE", path: `/api/lists/${f.listId}` }), expected: ownerOnly(200) },
  {
    name: "add entry",
    request: (f) => ({ method: "POST", path: `/api/lists/${f.listId}/items`, body: { tmdbId: f.newFilmTmdbId, itemType: "movie" } }),
    expected: entryEditors(201),
  },
  {
    name: "remove entry",
    request: (f) => ({ method: "DELETE", path: `/api/lists/${f.listId}/items/${f.entryIds[0]}` }),
    expected: entryEditors(200),
  },
  {
    name: "edit entry note",
    request: (f) => ({ method: "PATCH", path: `/api/lists/${f.listId}/items/${f.entryIds[0]}`, body: { note: "Watch first" } }),
    expected: entryEditors(200),
  },
  {
    name: "reorder entries",
    request: (f) => ({
      method: "PATCH",
      path: `/api/lists/${f.listId}/reorder`,
      body: { items: [...f.entryIds].reverse().map((id, i) => ({ id, position: i + 1 })) },
    }),
    expected: entryEditors(200),
  },
  {
    name: "invite collaborator",
    request: (f) => ({ method: "POST", path: `/api/lists/${f.listId}/collaborators`, body: { username: "__target__" } }),
    expected: ownerOnly(201),
  },
  {
    name: "remove another collaborator",
    request: (f) => ({ method: "DELETE", path: `/api/lists/${f.listId}/collaborators/${f.bystanderId}` }),
    expected: ownerOnly(200),
  },
];

describe("list write endpoints × List Collaborator role", () => {
  let server: RunningTestServer;
  const users = {} as Record<Role | "bystander" | "target", SignedUpTestUser & { id: string }>;

  beforeAll(async () => {
    server = await startTestServer();
    const names = ["owner", "collaborator", "invitee", "stranger", "bystander", "target"] as const;
    const signed = await Promise.all(names.map((name) => signUpTestUser(server.baseUrl, `cp${name.slice(0, 4)}`)));
    await Promise.all(
      names.map(async (name, i) => {
        users[name] = { ...signed[i]!, id: await userIdOf(signed[i]!.username) };
      }),
    );
  });

  afterAll(async () => {
    await server.close();
  });

  // A fresh private list per case, so destructive calls don't leak between cases.
  const setUp = async (): Promise<Fixture> => {
    const list = await createListViaApi(server.baseUrl, users.owner.jar, { isPublic: false });
    const ownerId = users.owner.id;
    const [entryIds, film] = await Promise.all([
      seedListEntries(list.id, 2),
      seedTestFilm("New title"),
      seedCollaborator(list.id, users.collaborator.id, ownerId, "accepted"),
      seedCollaborator(list.id, users.invitee.id, ownerId, "invited"),
      seedCollaborator(list.id, users.bystander.id, ownerId, "accepted"),
    ]);
    return { listId: list.id, entryIds, bystanderId: users.bystander.id, newFilmTmdbId: film.tmdbId };
  };

  for (const endpoint of ENDPOINTS) {
    for (const role of ["owner", "collaborator", "invitee", "stranger"] as const) {
      const expected = endpoint.expected[role];
      it(`${endpoint.name} as ${role} → ${expected}`, async () => {
        const fixture = await setUp();
        const { method, path, body } = endpoint.request(fixture);
        const resolvedBody =
          body && typeof body === "object" && "username" in body ? { username: users.target.username } : body;

        const response = await jsonRequest(server.baseUrl, path, method, resolvedBody, users[role].jar);
        expect(response.status).toBe(expected);
      });
    }
  }

  it("a signed-out request to any write endpoint is a 401", async () => {
    const fixture = await setUp();
    for (const endpoint of ENDPOINTS) {
      const { method, path, body } = endpoint.request(fixture);
      const response = await jsonRequest(server.baseUrl, path, method, body);
      expect(response.status).toBe(401);
    }
  });
});
