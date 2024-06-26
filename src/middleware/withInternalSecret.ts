import { NextFunction, Response } from 'express'
import { INTERNAL_SECRET_API_KEY } from '../constants/config'
import { RequestWithAuth } from '../types/api'

export const withInternalSecret = async (req: RequestWithAuth, res: Response, next: NextFunction) => {
  try {
    const secret = req.headers.authorization

    if (!secret || secret !== INTERNAL_SECRET_API_KEY) return res.sendStatus(418)

    next()
  } catch (error) {
    return res.status(418).send(error)
  }
}
