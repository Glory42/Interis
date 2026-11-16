import { authHandlers } from "./auth";
import { diaryHandlers } from "./diary";
import { filmsHandlers } from "./films";
import { tvHandlers } from "./tv";
import { usersHandlers } from "./users";

export const handlers = [
  ...authHandlers,
  ...diaryHandlers,
  ...usersHandlers,
  ...filmsHandlers,
  ...tvHandlers,
];
