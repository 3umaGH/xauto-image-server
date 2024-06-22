import { NextFunction, Response } from 'express'
import admin from 'firebase-admin'
import { RequestWithAuth } from '../types/api'

export const withOptionalAuth = async (req: RequestWithAuth, res: Response, next: NextFunction) => {
  try {
    const idToken = req.headers.authorization

    if (idToken) {
      admin
        .auth()
        .verifyIdToken(idToken)
        .then(async decodedToken => {
          req.decodedAuth = decodedToken
        })
        .catch(err => {
          // Auth is optional, so ignore any errors.
        })
        .finally(() => {
          next()
        })
    } else {
      next()
    }
  } catch (error) {
    next()
    // Auth is optional, so ignore any errors.
  }
}
