import {
  ContainerType,
  PrivateImageContainerDTO,
  PrivateImageDTO,
  PublicImageContainerDTO,
  PublicImageDTO,
} from '../types/dto/imageContainerDTO'
import { Image, ImageContainer } from '../types/image'
import { bytesToMB, roundDecimals } from '../util/util'

export function imageContainerToDTO(container: ImageContainer, type: ContainerType.PRIVATE): PrivateImageContainerDTO
export function imageContainerToDTO(container: ImageContainer, type: ContainerType.PUBLIC): PublicImageContainerDTO

export function imageContainerToDTO(
  container: ImageContainer,
  type: ContainerType
): PrivateImageContainerDTO | PublicImageContainerDTO {
  const { _id, images, total_size, _owner } = container
  const total_size_mb = roundDecimals(bytesToMB(total_size), 2)

  if (type === ContainerType.PRIVATE) {
    return {
      _id,
      type: ContainerType.PRIVATE,
      images: images.map(image => imageToPrivateDTO(image)),
      total_size_mb,
      _owner,
    }
  } else {
    return {
      type: ContainerType.PUBLIC,
      images: images.filter(image => image.status === 'DONE').map(image => imageToPublicDTO(image)),
    }
  }
}

const imageToPublicDTO = (image: Image): PublicImageDTO => {
  const { order, url, thumb } = image
  return { order, url, thumb }
}

const imageToPrivateDTO = (image: Image): PrivateImageDTO => {
  const { id, order, url, thumb, size, status } = image
  return { id, order, url, thumb, size, status, ...(image.status === 'ERROR' ? { error: image.error } : {}) }
}
