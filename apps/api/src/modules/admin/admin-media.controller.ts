import type { Request, Response } from "express";
import type { z } from "zod";
import { sendNotFound, sendValidationError } from "../../commons/http/validation-response.helper";
import { AdminMediaService, type AdminMediaFields, type AdminMediaKind } from "./admin-media.service";
import {
  AdminListMediaQuerySchema,
  AdminMediaIdParamsSchema,
  AdminUpdateFilmSchema,
  AdminUpdateSeriesSchema,
  type AdminListMediaQuery,
} from "./dto/admin-media.dto";

type KindConfig<K extends AdminMediaKind> = {
  updateSchema: z.ZodType<AdminMediaFields[K]>;
  notFound: string;
};

const kinds: { [K in AdminMediaKind]: KindConfig<K> } = {
  movie: { updateSchema: AdminUpdateFilmSchema, notFound: "Movie not found" },
  serial: { updateSchema: AdminUpdateSeriesSchema, notFound: "Series not found" },
};

const parseId = (req: Request<{ id: string }>, res: Response): number | null => {
  const params = AdminMediaIdParamsSchema.safeParse(req.params);
  if (!params.success) {
    sendValidationError(res, params.error);
    return null;
  }
  return params.data.id;
};

export class AdminMediaController {
  // The same four handlers for /movies and /serials, bound to one media kind.
  static forKind<K extends AdminMediaKind>(kind: K) {
    const { updateSchema, notFound }: KindConfig<K> = kinds[kind];

    return {
      async list(req: Request<{}, {}, {}, AdminListMediaQuery>, res: Response): Promise<void> {
        const parsed = AdminListMediaQuerySchema.safeParse(req.query);
        if (!parsed.success) {
          sendValidationError(res, parsed.error);
          return;
        }
        const { query, limit, offset } = parsed.data;
        res.status(200).json(await AdminMediaService.list(kind, query, limit ?? 20, offset ?? 0));
      },

      async update(req: Request<{ id: string }>, res: Response): Promise<void> {
        const id = parseId(req, res);
        if (id === null) return;
        const body = updateSchema.safeParse(req.body);
        if (!body.success) {
          sendValidationError(res, body.error);
          return;
        }

        const updated = await AdminMediaService.update(kind, id, body.data, req.user);
        if (!updated) {
          sendNotFound(res, notFound);
          return;
        }
        res.status(200).json(updated);
      },

      async refresh(req: Request<{ id: string }>, res: Response): Promise<void> {
        const id = parseId(req, res);
        if (id === null) return;

        const refreshed = await AdminMediaService.refresh(kind, id, req.user);
        if (!refreshed) {
          sendNotFound(res, notFound);
          return;
        }
        res.status(200).json(refreshed);
      },

      async remove(req: Request<{ id: string }>, res: Response): Promise<void> {
        const id = parseId(req, res);
        if (id === null) return;

        if (!(await AdminMediaService.remove(kind, id, req.user))) {
          sendNotFound(res, notFound);
          return;
        }
        res.status(200).json({ success: true });
      },
    };
  }
}
