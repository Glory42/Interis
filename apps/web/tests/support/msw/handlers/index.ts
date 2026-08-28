import { authHandlers } from "./auth";
import { feedHandlers } from "./feed";
import { moviesHandlers } from "./movies";
import { musicHandlers } from "./music";
import { serialsHandlers } from "./serials";
import { usersHandlers } from "./users";

export const handlers = [
  ...authHandlers,
  ...usersHandlers,
  ...feedHandlers,
  ...moviesHandlers,
  ...serialsHandlers,
  ...musicHandlers,
];
