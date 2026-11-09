import { authHandlers } from "./auth";
import { filmsHandlers } from "./films";
import { tvHandlers } from "./tv";
import { usersHandlers } from "./users";

export const handlers = [
  ...authHandlers,
  ...usersHandlers,
  ...filmsHandlers,
  ...tvHandlers,
];
