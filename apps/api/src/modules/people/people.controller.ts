import type { Request, Response } from "express";
import {
  sendBadRequest,
  sendNotFound,
  sendValidationError,
} from "../../commons/http/validation-response.helper";
import { normalizePersonRouteSlug } from "./helpers/people-slug.helper";
import {
  PersonCreditsQuerySchema,
  personRouteRoleSchema,
  type PersonRouteParams,
} from "./dto/people.dto";
import { PeopleDetailService } from "./services/people-detail.service";
import type { PersonRouteRole } from "./types/people.types";

// TMDB person data changes slowly and nothing here is viewer-specific.
const PERSON_CACHE_CONTROL = "public, max-age=300";

const parsePersonRoute = (
  req: Request<PersonRouteParams>,
  res: Response,
): { role: PersonRouteRole; slug: string } | null => {
  const parsedRole = personRouteRoleSchema.safeParse(req.params.role);
  if (!parsedRole.success) {
    sendBadRequest(res, "Invalid person role");
    return null;
  }

  const normalizedSlug = normalizePersonRouteSlug(req.params.slug);
  if (!normalizedSlug) {
    sendBadRequest(res, "Invalid person slug");
    return null;
  }

  return { role: parsedRole.data, slug: normalizedSlug };
};

export class PeopleController {
  static async getByRoleAndSlug(
    req: Request<PersonRouteParams>,
    res: Response,
  ): Promise<void> {
    const route = parsePersonRoute(req, res);
    if (!route) {
      return;
    }

    const detail = await PeopleDetailService.getPersonDetailByRoleAndSlug(route);

    if (!detail) {
      sendNotFound(res, "Person not found");
      return;
    }

    res.setHeader("Cache-Control", PERSON_CACHE_CONTROL);
    res.status(200).json(detail);
  }

  static async getCredits(req: Request<PersonRouteParams>, res: Response): Promise<void> {
    const route = parsePersonRoute(req, res);
    if (!route) {
      return;
    }

    const parsedQuery = PersonCreditsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      sendValidationError(res, parsedQuery.error);
      return;
    }

    const page = await PeopleDetailService.getPersonCredits(route.slug, parsedQuery.data);
    if (!page) {
      sendNotFound(res, "Person not found");
      return;
    }

    res.setHeader("Cache-Control", PERSON_CACHE_CONTROL);
    res.status(200).json(page);
  }
}
