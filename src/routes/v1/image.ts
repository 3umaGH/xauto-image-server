import { NextFunction, Response } from 'express'
import { ObjectId } from 'mongodb'
import { onContainerUpdated } from '../../api/internal'
import { MAX_CONTAINER_FILES, MAX_CONTAINER_SIZE_MB } from '../../constants/config'
import { upload } from '../../constants/multer'
import {
  appendImagesToContainer,
  deleteImageFromContainer,
  getContainerOrNull,
  imageChangeOrder,
} from '../../database/operations/imageOperations'
import { imageContainerToDTO } from '../../dto/imageContainerToDTO'
import { validateFileUpload } from '../../middleware/validateFileUpload'
import { withAuth } from '../../middleware/withAuth'
import {
  addImagesToContainerAPIResponse,
  getConstraintsAPIResponse,
  getContainerImagesAPIResponse,
  getContainerImagesAsOwnerAPIResponse,
  imageActionAPIResponse,
  RequestWithAuth,
} from '../../types/api'
import { IMAGE_CONTAINER_ACTION, ImageContainer } from '../../types/image'
import { deleteImageFiles } from '../../util/imageUtils'
import { withOptionalAuth } from '../../middleware/withOptionalAuth'
import { ContainerType } from '../../types/dto/imageContainerDTO'

const express = require('express')
const router = express.Router()

/* Sends to the main api internal endpoint a new container, if the first 3 images are different 
between prev and next container. This is used to update the listings objects preview property. */
export const handleCompareImages = async (prevContainer: ImageContainer, nextContainer: ImageContainer) => {
  const prevImages = prevContainer.images.splice(0, 3).map(img => img.id)
  const newImages = nextContainer.images.splice(0, 3).map(img => img.id)

  const didImageOrderUpdate = JSON.stringify(prevImages) !== JSON.stringify(newImages)
  if (didImageOrderUpdate) {
    console.log('Sending update request to', nextContainer._id.toString())

    await onContainerUpdated(nextContainer._id.toString())
  }
}

router.get('/constraints', async (req: RequestWithAuth, res: Response, next: NextFunction) => {
  try {
    const response: getConstraintsAPIResponse = {
      max_size_mb: MAX_CONTAINER_SIZE_MB,
      max_files: MAX_CONTAINER_FILES,
    }

    res.status(200).send(response)
  } catch (err) {
    next(err)
  }
})

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
        return res.status(403).send({ message: 'Unauthorized' })
      }

      const result = await appendImagesToContainer(req.decodedAuth!.uid, containerID, files)
      const response: addImagesToContainerAPIResponse = imageContainerToDTO(result, ContainerType.PRIVATE)

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
      return res.status(403).send({ message: 'Unauthorized' })
    }

    const targetIndex = container.images.findIndex(img => img.id === imageId)

    if (targetIndex === -1) {
      return res.status(404).send({ message: 'Image does not exist' })
    }

    if (action === IMAGE_CONTAINER_ACTION.DELETE) {
      const result = await deleteImageFromContainer(req.decodedAuth!.uid, container, imageId)
      const response: imageActionAPIResponse = imageContainerToDTO(result, ContainerType.PRIVATE)

      await handleCompareImages(container, result)
      return res.status(200).send(response)
    }

    if (action === IMAGE_CONTAINER_ACTION.MOVE_UP_ORDER || action === IMAGE_CONTAINER_ACTION.MOVE_DOWN_ORDER) {
      const result = await imageChangeOrder(req.decodedAuth!.uid, container, imageId, action)

      if (result) {
        const response: imageActionAPIResponse = imageContainerToDTO(result, ContainerType.PRIVATE)

        await handleCompareImages(container, result)
        return res.status(200).send(response)
      } else {
        return res.status(200).send(imageContainerToDTO(container, ContainerType.PRIVATE))
      }
    }

    return res.status(400).send({ message: 'Bad Request' })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', withOptionalAuth, async (req: RequestWithAuth, res: Response, next: NextFunction) => {
  try {
    const authUID = req.decodedAuth?.uid
    const containerID = new ObjectId(req.params.id)
    const existingContainer = await getContainerOrNull(containerID)

    if (!existingContainer) {
      return res.status(404).send({ message: 'Container does not exist' })
    }

    if (authUID) {
      if (existingContainer._owner != authUID) {
        return res.status(403).send({ message: 'Unauthorized' })
      }

      const response: getContainerImagesAsOwnerAPIResponse = imageContainerToDTO(
        existingContainer,
        ContainerType.PRIVATE
      )
      res.status(200).send(response)
    } else {
      const response: getContainerImagesAPIResponse = imageContainerToDTO(existingContainer, ContainerType.PUBLIC)
      res.status(200).send(response)
    }
  } catch (err) {
    next(err)
  }
})

module.exports = router
