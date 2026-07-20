import type { Request, Response, NextFunction, RequestHandler } from "express";

export const asyncHandler = (
  // Wraps handlers whose Request<Params, ResBody, ReqBody, Query> generics vary
  // per controller; `any` is the only variance-safe way to accept all of them.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (req: Request<any, any, any, any>, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
