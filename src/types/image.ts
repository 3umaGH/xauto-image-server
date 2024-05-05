import { WithCreatedUpdatedDates, WithOwner } from './common'

export type ImageStatus = 'OPTIMIZING' | 'ERROR' | 'READY'
export type Image = ImageInProcess | UploadedImage | ImageWithError

export type ImageContainer = {
  total_size_mb: number
  images: Image[]
} & WithCreatedUpdatedDates &
  WithOwner

type ImageBase = {
  id: string
  order: number
  url: string

  size_mb: number
  local_path: string
}

type ImageWithError = ImageBase & {
  status: 'ERROR'
  error: string
}

type ImageInProcess = ImageBase & {
  status: 'OPTIMIZING'
}

type UploadedImage = ImageBase & {
  status: 'READY'
}
