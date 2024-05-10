import { Image, ImageContainer } from '../types/image'
import { ImageContainerDTO, ImageDTO } from '../types/dto/imageContainerDTO'
import { bytesToMB, roundDecimals } from '../util/util'

export const imageContainerToDTO = (container: ImageContainer): ImageContainerDTO => {
  const { _id, images, total_size, _owner } = container
  const total_size_mb = roundDecimals(bytesToMB(total_size), 2)

  return { _id, images: images.map(image => imageToDTO(image)), total_size_mb, _owner }
}

const imageToDTO = (image: Image): ImageDTO => {
  const { id, order, url, size, status } = image

  return { id, order, url, size, status, ...(image.status === 'ERROR' ? { error: image.error } : {}) }
}
