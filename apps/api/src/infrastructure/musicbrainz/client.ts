import { MusicBrainzApi, CoverArtArchiveApi } from "musicbrainz-api";

const contactInfo = process.env.MUSICBRAINZ_USER_AGENT ?? "contact@interis.app";

export const mbApi = new MusicBrainzApi({
  appName: "Interis",
  appVersion: "1.0",
  appContactInfo: contactInfo,
});

export const caaApi = new CoverArtArchiveApi();
