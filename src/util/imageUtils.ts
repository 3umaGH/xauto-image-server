import { v4 as uuidv4 } from 'uuid'
import { Image } from '../types/image'

export const mapFilesToListingImages = (containerID: string, files: Express.Multer.File[]) => {
  return files.map(
    (file, index) =>
      ({
        id: uuidv4().toString(),
        order: index,
        url: `http://localhost:8000/cdn/${containerID}/${file.filename}`,
        status: 'UPLOADED',

        size: file.size,
        local_path: file.path,
      }) as Image
  )
}

export const getTotalFileSize = (files: Express.Multer.File[]) => {
  return files.reduce((accumulator, file) => (accumulator += file.size / 1024 / 1024), 0)
}
