import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/films/$tmdbId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/cinema/$tmdbId",
      params: { tmdbId: params.tmdbId },
    });
  },
});
