import { WithCreatedUpdatedDates, WithObjectID, WithOwner, WithOwnerType } from './common'

export type ImageStatus = 'OPTIMIZING' | 'ERROR' | 'READY'
export type Image = ImageInProcess | OptimizedImage | ImageWithError

export type DraftImageContainer = {
  total_size: number
  images: Image[]
} & WithCreatedUpdatedDates &
  WithOwner & WithOwnerType

export type ImageContainer = DraftImageContainer & WithObjectID

type ImageBase = {
  id: string
  order: number
  url: string
  thumb: string

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

export enum IMAGE_CONTAINER_ACTION {
  MOVE_ORDER,
  DELETE,
}
