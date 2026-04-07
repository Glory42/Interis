import type { Request, Response } from "express";
import { sendBadRequest } from "../../commons/http/validation-response.helper";
import { normalizePersonRouteSlug } from "./helpers/people-slug.helper";
import { personRouteRoleSchema, type PersonRouteParams } from "./dto/people.dto";
import { PeopleService } from "./people.service";

export class PeopleController {
  static async getByRoleAndSlug(
    req: Request<PersonRouteParams>,
    res: Response,
  ): Promise<void> {
    const parsedRole = personRouteRoleSchema.safeParse(req.params.role);
    if (!parsedRole.success) {
      sendBadRequest(res, "Invalid person role");
      return;
    }

    const normalizedSlug = normalizePersonRouteSlug(req.params.slug);
    if (!normalizedSlug) {
      sendBadRequest(res, "Invalid person slug");
      return;
    }

    const detail = await PeopleService.getPersonDetailByRoleAndSlug({
      role: parsedRole.data,
      slug: normalizedSlug,
    });

    if (!detail) {
      res.status(404).json({ error: "Person not found" });
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(detail);
  }
}
