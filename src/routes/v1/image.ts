import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { upload } from '../../constants/multer'
import { MAX_CONTAINER_FILES } from '../../constants/config'
import {
  getContainerOrNull,
  appendImagesToContainer,
  createImageContainer,
  deleteImageFromContainer,
  imageChangeOrder,
} from '../../database/operations/imageOperations'
import { imageContainerToDTO } from '../../dto/imageContainerToDTO'
import { validateFileUpload } from '../../middleware/validateFileUpload'
import { withAuth } from '../../middleware/withAuth'
import { RequestWithAuth, AddImagesToContainerAPIResponse, ImageActionAPIResponse } from '../../types/api'
import { IMAGE_CONTAINER_ACTION, ImageContainer } from '../../types/image'
import { deleteImageFiles } from '../../util/imageUtils'
import { onContainerUpdated } from '../../api/internal'

const express = require('express')
const router = express.Router()

/* Sends to the main api internal endpoint a new container, if the first 3 images are different 
between prev and next container. This is used to update the listings objects preview property. */
const handleCompareImages = async (prevContainer: ImageContainer, nextContainer: ImageContainer) => {
  const prevImages = prevContainer.images.splice(0, 3).map(img => img.id)
  const newImages = nextContainer.images.splice(0, 3).map(img => img.id)

  const didImageOrderUpdate = JSON.stringify(prevImages) !== JSON.stringify(newImages)
  if (didImageOrderUpdate) {
    console.log('Sending update request to', nextContainer._id.toString())

    await onContainerUpdated(nextContainer._id.toString())
  }
}

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

      if (!existingContainer) {
        deleteImageFiles(req.files as Express.Multer.File[])
        return res.status(404).send({ message: 'Container not found' })
      }

      if (existingContainer._owner != authUID) {
        deleteImageFiles(req.files as Express.Multer.File[])
        return res.status(401).send({ message: 'Unauthorized' })
      }

      const result = await appendImagesToContainer(req.decodedAuth!.uid, containerID, files)
      const response: AddImagesToContainerAPIResponse = imageContainerToDTO(result)

      await handleCompareImages(existingContainer, result)
      return res.status(200).send(response)
    } catch (err) {
      deleteImageFiles(req.files as Express.Multer.File[])
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
      return res.status(401).send({ message: 'Unauthorized' })
    }

    const targetIndex = container.images.findIndex(img => img.id === imageId)

    if (targetIndex === -1) {
      return res.status(404).send({ message: 'Image does not exist' })
    }

    if (action === IMAGE_CONTAINER_ACTION.DELETE) {
      const result = await deleteImageFromContainer(req.decodedAuth!.uid, container, imageId)
      const response: ImageActionAPIResponse = imageContainerToDTO(result)

      await handleCompareImages(container, result)
      return res.status(200).send(response)
    }

    if (action === IMAGE_CONTAINER_ACTION.MOVE_UP_ORDER || action === IMAGE_CONTAINER_ACTION.MOVE_DOWN_ORDER) {
      const result = await imageChangeOrder(req.decodedAuth!.uid, container, imageId, action)

      if (result) {
        const response: ImageActionAPIResponse = imageContainerToDTO(result)

        await handleCompareImages(container, result)
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
