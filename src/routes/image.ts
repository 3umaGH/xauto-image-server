import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { upload } from '../constants/multer'
import {
  appendImagesToContainer,
  createImageContainer,
  deleteImageFromContainer,
  getContainer,
  getContainerOrNull,
  imageChangeOrder,
} from '../database/operations/imageOperations'
import { withAuth } from '../middleware/withAuth'
import { RequestWithAuth, AddImagesToContainerAPIResponse, ImageActionAPIResponse } from '../types/api'
import { validateFileUpload } from '../middleware/validateFileUpload'
import { imageContainerToDTO } from '../dto/imageContainerToDTO'
import fs from 'fs'
import { MAX_CONTAINER_FILES } from '../constants/config'
import { IMAGE_CONTAINER_ACTION } from '../types/image'
import { deleteImageFiles } from '../util/imageUtils'

const express = require('express')
const router = express.Router()

router.post(
  '/:id',
  withAuth,
  upload.array('files', MAX_CONTAINER_FILES),
  validateFileUpload,
  async (req: RequestWithAuth, res: Response, next: NextFunction) => {
    try {
      if (!req.files || req.files.length === 0) return res.status(400).send({ message: 'Bad Request' })

      const authUID = req.decodedAuth!.uid
      const containerID = new ObjectId(req.params.id)
      const files = req.files as Express.Multer.File[]
      const existingContainer = await getContainerOrNull(containerID)

      if (existingContainer && existingContainer._owner != authUID) {
        deleteImageFiles(req.files as Express.Multer.File[])
        return res.status(401).send({ message: 'Not an owner' })
      }

      try {
        const result = existingContainer
          ? await appendImagesToContainer(req.decodedAuth!.uid, containerID, files)
          : await createImageContainer(req.decodedAuth!.uid, containerID, files)

        const response: AddImagesToContainerAPIResponse = imageContainerToDTO(result)

        return res.status(200).send(response)
      } catch (err) {
        if (req.files) {
          deleteImageFiles(req.files as Express.Multer.File[])
        }

        if (err instanceof Error) return res.status(400).send({ message: err.message })
      }
    } catch (err) {
      next(err)
    }
  }
)

router.post('/action/:id/:imageId', withAuth, async (req: RequestWithAuth, res: Response, next: NextFunction) => {
  try {
    const authUID = req.decodedAuth!.uid
    const containerId = new ObjectId(req.params.id)
    const imageId = req.params.imageId

    const action: IMAGE_CONTAINER_ACTION = req.body.action

    if (action === undefined) {
      return res.status(400).send({ message: 'Bad Request' })
    }

    const container = await getContainerOrNull(containerId)

    if (!container) {
      return res.status(404).send({ message: 'Container does not exist' })
    }

    if (container._owner != authUID) {
      return res.status(401).send({ message: 'Not an owner' })
    }

    const targetIndex = container.images.findIndex(img => img.id === imageId)

    if (targetIndex === -1) {
      return res.status(404).send({ message: 'Image does not exist' })
    }

    if (action === IMAGE_CONTAINER_ACTION.DELETE) {
      const result = await deleteImageFromContainer(req.decodedAuth!.uid, container, imageId)
      const response: ImageActionAPIResponse = imageContainerToDTO(result)

      return res.status(200).send(response)
    }

    if (action === IMAGE_CONTAINER_ACTION.MOVE_UP_ORDER || action === IMAGE_CONTAINER_ACTION.MOVE_DOWN_ORDER) {
      const result = await imageChangeOrder(req.decodedAuth!.uid, container, imageId, action)

      if (result) {
        const response: ImageActionAPIResponse = imageContainerToDTO(result)
        return res.status(200).send(response)
      } else {
        return res.status(200).send(imageContainerToDTO(container))
      }
    }

    return res.status(400).send({ message: 'Bad Request' })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req: RequestWithAuth, res: Response, next: NextFunction) => {
  try {
    const containerID = new ObjectId(req.params.id)
    const existingContainer = await getContainerOrNull(containerID)

    if (!existingContainer) {
      return res.status(404).send({ message: 'Container does not exist' })
    }

    const response: AddImagesToContainerAPIResponse = imageContainerToDTO(existingContainer)

    if (existingContainer) res.status(200).send(response)
  } catch (err) {
    next(err)
  }
})

module.exports = router
