import express, { Request, Response, NextFunction } from 'express'
import admin, { ServiceAccount } from 'firebase-admin'
import { RequestWithAuth } from '../types/api'
import { serviceAccount } from '../firebase/serviceAccount'
import { INTERNAL_SECRET_API_KEY } from '../constants/config'

export const withInternalSecret = async (req: RequestWithAuth, res: Response, next: NextFunction) => {
  try {
    const secret = req.headers.authorization

    if (!secret || secret !== INTERNAL_SECRET_API_KEY) return res.sendStatus(418)

    next()
  } catch (error) {
    return res.status(418)
  }
}
