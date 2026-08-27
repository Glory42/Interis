import { http, HttpResponse } from "msw";

export const musicHandlers = [
  http.get("*/api/music/:mbid/editions", () => {
    return HttpResponse.json({
      editions: [
        {
          mbid: "edition-1",
          title: "OK Computer",
          status: "Official",
          packaging: null,
          country: "GB",
          releaseDate: "1997-05-21",
          releaseYear: 1997,
          format: null,
          trackCount: null,
          disambiguation: null,
        },
        {
          mbid: "edition-2",
          title: "OK Computer (Collector's Edition)",
          status: "Official",
          packaging: "Box",
          country: "GB",
          releaseDate: "2009-03-24",
          releaseYear: 2009,
          format: null,
          trackCount: null,
          disambiguation: "collector's edition",
        },
      ],
    });
  }),
  http.get("*/api/music/editions/:editionMbid/tracks", () => {
    return HttpResponse.json({
      tracks: [
        {
          mbid: "recording-1",
          title: "Airbag",
          artistName: "Radiohead",
          length: 284400,
          disambiguation: null,
          discNumber: 1,
          position: 1,
        },
        {
          mbid: "recording-2",
          title: "Paranoid Android",
          artistName: "Radiohead",
          length: 383493,
          disambiguation: null,
          discNumber: 1,
          position: 2,
        },
      ],
    });
  }),
];
