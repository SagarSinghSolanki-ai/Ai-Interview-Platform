import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AnyZodObject } from 'zod';

export const validate = (schema: AnyZodObject): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};
