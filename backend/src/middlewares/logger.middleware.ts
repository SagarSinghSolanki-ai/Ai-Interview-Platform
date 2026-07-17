import { Request, Response, NextFunction } from 'express';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const timestamp = new Date().toISOString();
    
    // Log formatting: [timestamp] METHOD /url STATUS - duration ms (IP: ip)
    console.log(`[${timestamp}] ${method} ${originalUrl} ${statusCode} - ${duration}ms (IP: ${ip})`);
  });

  next();
};
