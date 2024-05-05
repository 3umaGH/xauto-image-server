import { WithCreatedUpdatedDates, WithOwner } from './common'

export type ImageStatus = 'OPTIMIZING' | 'ERROR' | 'READY'
export type Image = ImageInProcess | UploadedImage | OptimizedImage | ImageWithError

export type ImageContainer = {
  total_size: number
  images: Image[]
} & WithCreatedUpdatedDates &
  WithOwner

type ImageBase = {
  id: string
  order: number
  url: string

  size: number
  local_path: string
}

type ImageWithError = ImageBase & {
  status: 'ERROR'
  error: string
}

type ImageInProcess = ImageBase & {
  status: 'OPTIMIZING'
}

type OptimizedImage = ImageBase & {
  status: 'DONE'
}

type UploadedImage = ImageBase & {
  status: 'UPLOADED'
}

export enum IMAGE_CONTAINER_ACTION {
  MOVE_DOWN_ORDER,
  MOVE_UP_ORDER,
  DELETE,
}
