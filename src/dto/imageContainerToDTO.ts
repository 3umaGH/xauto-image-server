import { Image, ImageContainer } from '../types/image'
import { ImageContainerDTO, ImageDTO } from '../types/dto/imageContainerDTO'

export const imageContainerToDTO = (container: ImageContainer): ImageContainerDTO => {
  const { images, total_size_mb, _owner } = container

  return { images: images.map(image => imageToDTO(image)), total_size_mb, _owner }
}

const imageToDTO = (image: Image): ImageDTO => {
  const { id, order, url, size_mb, status } = image

  return { id, order, url, size_mb, status, ...(image.status === 'ERROR' ? { error: image.error } : {}) }
}
