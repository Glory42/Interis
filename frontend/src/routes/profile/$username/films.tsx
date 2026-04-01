import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/profile/$username/films")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/profile/$username/cinema",
      params: { username: params.username },
    });
  },
});
