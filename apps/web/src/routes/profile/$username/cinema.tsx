import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/profile/$username/cinema")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/profile/$username",
      params: { username: params.username },
    });
  },
});
