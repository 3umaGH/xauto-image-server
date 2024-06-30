import { Request, Response, NextFunction } from 'express'
import { Options } from 'express-rate-limit'

export const rateLimitHandler = (req: Request, res: Response, next: NextFunction, options: Partial<Options>): void => {
  res.status(options.statusCode || 429).json({
    message: 'Too many requests, please try again later.',
  })
}
