import type { Request, Response } from "express";
import { sendBadRequest, sendNotFound } from "../../commons/http/validation-response.helper";
import { parseMbidParam } from "./dto/music.dto";
import { MusicCacheService } from "./services/music-cache.service";
import { EditionsCacheService } from "./services/editions-cache.service";
import type { EditionListItem, EditionTrackItem } from "./types/music.types";

export class MusicEditionsController {
  static async getEditions(req: Request<{ mbid: string }>, res: Response): Promise<void> {
    const mbid = parseMbidParam(req.params.mbid);
    if (!mbid) {
      sendBadRequest(res, "Invalid album ID");
      return;
    }

    const album = await MusicCacheService.findOrCreate(mbid);
    if (!album) {
      sendNotFound(res, "Album not found");
      return;
    }

    const rows = await EditionsCacheService.findOrCreateEditionsForAlbum(album.id, album.mbid);
    const editions: EditionListItem[] = rows.map((row) => ({
      mbid: row.mbid,
      title: row.title,
      status: row.status,
      packaging: row.packaging,
      country: row.country,
      releaseDate: row.releaseDate,
      releaseYear: row.releaseYear,
      format: row.format,
      trackCount: row.trackCount,
      disambiguation: row.disambiguation,
    }));

    res.status(200).json({ editions });
  }

  static async getEditionTracklist(
    req: Request<{ editionMbid: string }>,
    res: Response,
  ): Promise<void> {
    const editionMbid = parseMbidParam(req.params.editionMbid);
    if (!editionMbid) {
      sendBadRequest(res, "Invalid edition ID");
      return;
    }

    const rows = await EditionsCacheService.findOrCreateTracklistByEditionMbid(editionMbid);
    if (rows === null) {
      sendNotFound(res, "Edition not found");
      return;
    }

    const tracks: EditionTrackItem[] = rows.map((row) => ({
      mbid: row.mbid,
      title: row.title,
      artistName: row.artistName,
      length: row.length,
      disambiguation: row.disambiguation,
      discNumber: row.discNumber,
      position: row.position,
    }));

    res.status(200).json({ tracks });
  }
}
