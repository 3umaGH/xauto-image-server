import { Request, Response, NextFunction } from 'express'
import { ObjectId } from 'mongodb'
import { MAX_CONTAINER_FILES, MAX_CONTAINER_SIZE_MB } from '../constants/config'
import { getContainer, getContainerOrNull } from '../database/operations/imageOperations'
import { bytesToMB } from '../util/util'
import fs from 'fs'
import { deleteImageFiles } from '../util/imageUtils'

export const validateFileUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const containerID = new ObjectId(req.params.id)
    const existingContainer = await getContainerOrNull(containerID)
    const files = req.files as Express.Multer.File[]

    if (files.length > MAX_CONTAINER_FILES) {
      // Enforce maximum files on new upload
      throw new Error('Container files limit reached')
    }

    if (existingContainer === null || files.length === 0) {
      next()
    } else {
      const totalSize = files.reduce((accumulator, file) => (accumulator += file.size), 0)

      if (bytesToMB(existingContainer.total_size + totalSize) > MAX_CONTAINER_SIZE_MB) {
        throw new Error(`Container size limit reached (Maximum ${MAX_CONTAINER_SIZE_MB} MB)`)
      }

      if (files.length + existingContainer.images.length > MAX_CONTAINER_FILES) {
        // Enforce maximum files on appending images
        throw new Error(`Container files limit reached (Maximum ${MAX_CONTAINER_FILES} files)`)
      }

      next()
    }
  } catch (err) {
    const files = req.files as Express.Multer.File[]

    // Delete uploaded images if they fail validation.
    deleteImageFiles(files)

    return res.status(500).send({ message: (err as Error).message })
  }
}
