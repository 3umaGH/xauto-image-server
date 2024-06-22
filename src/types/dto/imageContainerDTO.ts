import { WithObjectID, WithOwner } from '../common'
import { Image } from '../image'

export enum ContainerType {
  PUBLIC,
  PRIVATE,
}

export type PrivateImageContainerDTO = {
  type: ContainerType.PRIVATE
  total_size_mb: number
  images: PrivateImageDTO[]
} & WithOwner &
  WithObjectID

export type PublicImageContainerDTO = {
  type: ContainerType.PUBLIC
  images: PublicImageDTO[]
}

export type PublicImageDTO = { order: number; url: string; thumb: string }
export type PrivateImageDTO = Omit<Image, 'local_path'>
