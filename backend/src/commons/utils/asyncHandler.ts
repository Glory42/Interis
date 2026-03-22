import type { Request, Response, NextFunction, RequestHandler } from "express";

export const asyncHandler = (
  fn: (
    req: Request<any, any, any, any>,
    res: Response,
    next: NextFunction,
  ) => Promise<void>,
): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
