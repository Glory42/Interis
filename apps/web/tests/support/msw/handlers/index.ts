import { authHandlers } from "./auth";
import { feedHandlers } from "./feed";
import { filmsHandlers } from "./films";
import { tvHandlers } from "./tv";
import { usersHandlers } from "./users";

export const handlers = [
  ...authHandlers,
  ...usersHandlers,
  ...feedHandlers,
  ...filmsHandlers,
  ...tvHandlers,
];
