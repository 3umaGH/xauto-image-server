import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier'
import { Request } from 'express'
import { ImageContainer } from './image'
import { ImageContainerDTO } from './dto/imageContainerDTO'

export type RequestWithAuth = {
  decodedAuth?: DecodedIdToken
} & Request

export type AddImagesToContainerAPIResponse = ImageContainerDTO
export type GetContainerImagesAPIResponse = ImageContainerDTO

export type ImageActionAPIResponse = ImageContainerDTO
