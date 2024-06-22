import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier'
import { Request } from 'express'
import { PrivateImageContainerDTO, PublicImageContainerDTO } from './dto/imageContainerDTO'

export type RequestWithAuth = {
  decodedAuth?: DecodedIdToken
} & Request

export type getConstraintsAPIResponse = {
  max_size_mb: number
  max_files: number
}

export type addImagesToContainerAPIResponse = PrivateImageContainerDTO
export type imageActionAPIResponse = PrivateImageContainerDTO
export type getContainerImagesAPIResponse = PublicImageContainerDTO
export type getContainerImagesAsOwnerAPIResponse = PrivateImageContainerDTO
