import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier'
import { Request } from 'express'
import { ImageContainerDTO } from './dto/imageContainerDTO'

export type RequestWithAuth = {
  decodedAuth?: DecodedIdToken
} & Request

export type GetConstraintsAPIResponse = {
  max_size_mb: number
  max_files: number
}

export type AddImagesToContainerAPIResponse = ImageContainerDTO
export type GetContainerImagesAPIResponse = ImageContainerDTO
export type ImageActionAPIResponse = ImageContainerDTO
