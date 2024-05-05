import express, { Request, Response, NextFunction } from 'express'
import admin, { ServiceAccount } from 'firebase-admin'
import { RequestWithAuth } from '../types/api'
import { serviceAccount } from '../firebase/serviceAccount'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
})

export const withAuth = async (req: RequestWithAuth, res: Response, next: NextFunction) => {
  try {
    const idToken = req.headers.authorization

    if (!idToken) return res.status(401).send({ message: 'Unauthorized: No ID token provided' })

    admin
      .auth()
      .verifyIdToken(idToken)
      .then(decodedToken => {
        req.decodedAuth = decodedToken

        next()
      })
      .catch(() => {
        return res.status(401).send({ message: 'Unauthorized: Invalid ID token' })
      })
  } catch (error) {
    return res.status(401).send({ message: 'Unauthorized: Invalid ID token' })
  }
}
