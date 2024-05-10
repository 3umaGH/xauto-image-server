import { v4 as uuidv4 } from 'uuid'
import { Image, ImageContainer } from '../types/image'
import fs from 'fs'

export const mapFilesToListingImages = (containerID: string, files: Express.Multer.File[]) => {
  return files.map(
    (file, index) =>
      ({
        id: uuidv4().toString(),
        order: index,
        url: `http://localhost:8001/cdn/${containerID}/${file.filename}`,
        status: 'OPTIMIZING',

        size: file.size,
        local_path: file.path,
      }) as Image
  )
}

export const getTotalFileSize = (files: Express.Multer.File[]) => {
  return files.reduce((accumulator, file) => (accumulator += file.size), 0)
}

export const calculateContainerSize = (container: ImageContainer) => {
  return container.images.reduce((acc: number, image: Image) => (acc += image.size), 0)
}

export const deleteImageFiles = (files: Express.Multer.File[]) => {
  if (!files || !Array.isArray(files)) return

  // Delete uploaded images if they fail validation.
  files.forEach(file => {
    try {
      if (file.path) fs.unlinkSync(file.path)
    } catch {}
  })
}
