import express, { Request, Response, NextFunction } from 'express'

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[${new Date().toLocaleTimeString()}]`, 'Message:', err.message, `| URL: ${req.url}`, '| IP:', req.ip)
  res.status(500).send({ message: err.message })
}
