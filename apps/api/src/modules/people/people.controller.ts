import type { Context } from "hono";
import { sendBadRequest, sendNotFound } from "../../commons/http/validation-response.hono";
import { normalizePersonRouteSlug } from "./helpers/people-slug.helper";
import { personRouteRoleSchema } from "./dto/people.dto";
import { PeopleDetailService } from "./services/people-detail.service";

export class PeopleController {
  static async getByRoleAndSlug(c: Context): Promise<Response> {
    const parsedRole = personRouteRoleSchema.safeParse(c.req.param("role"));
    if (!parsedRole.success) {
      return sendBadRequest(c, "Invalid person role");
    }

    const normalizedSlug = normalizePersonRouteSlug(c.req.param("slug") as string);
    if (!normalizedSlug) {
      return sendBadRequest(c, "Invalid person slug");
    }

    const detail = await PeopleDetailService.getPersonDetailByRoleAndSlug({
      role: parsedRole.data,
      slug: normalizedSlug,
    });

    if (!detail) {
      return sendNotFound(c, "Person not found");
    }

    c.header("Cache-Control", "no-store");
    return c.json(detail, 200);
  }
}
