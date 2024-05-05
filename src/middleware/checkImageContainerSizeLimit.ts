import { Request, Response, NextFunction } from 'express'
import { ObjectId } from 'mongodb'
import { MAX_CONTAINER_SIZE_MB } from '../constants/config'
import { getContainer } from '../database/operations/imageOperations'
import { bytesToMB } from '../util/util'

export const checkImageContainerSizeLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const containerID = new ObjectId(req.params.id)
    const existingContainer = await getContainer(containerID)
    const files = req.files as Express.Multer.File[]

    if (existingContainer === null || files.length === 0) {
      next()
    } else {
      const totalSize = files.reduce((accumulator, file) => (accumulator += file.size), 0)

      if (bytesToMB(existingContainer.total_size + totalSize) > MAX_CONTAINER_SIZE_MB) {
        return res.status(413).send({ message: 'Container size limit reached' })
      } else {
        next()
      }
    }
  } catch (err) {
    return res.status(500).send({ message: 'Internal Error' })
  }
}
