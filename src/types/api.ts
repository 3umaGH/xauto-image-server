import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier'

export type RequestWithAuth = {
  decodedAuth?: DecodedIdToken
} & Request
