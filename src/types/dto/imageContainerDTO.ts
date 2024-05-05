import { WithOwner } from '../common'
import { Image } from '../image'

export type ImageContainerDTO = {
  total_size_mb: number
  images: ImageDTO[]
} & WithOwner

export type ImageDTO = Omit<Image, 'local_path'>
