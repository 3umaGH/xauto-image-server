import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { upload } from '../constants/multer'
import { createImageContainer, getContainerOrNull } from '../database/operations/imageOperations'
import { withAuth } from '../middleware/withAuth'
import { PostImageContainerAPIResponse, RequestWithAuth } from '../types/api'
import { checkImageContainerSizeLimit } from '../middleware/checkImageContainerSizeLimit'
import { imageContainerToDTO } from '../dto/imageContainerToDTO'

const express = require('express')
const router = express.Router()

router.post(
  '/:id',
  withAuth,
  upload.array('file', 20),
  checkImageContainerSizeLimit,
  async (req: RequestWithAuth, res: Response, next: NextFunction) => {
    try {
      if (!req.files || req.files.length === 0) return res.status(400).send({ message: 'Bad Request' })

      const containerID = new ObjectId(req.params.id)
      const files = req.files as Express.Multer.File[]
      //const existingContainer = await getContainerOrNull(containerID)

      /*if (existingContainer === null) {
        const pairedListing = await getDraftListingOrNull(containerID)

        if (pairedListing === null) return res.status(400).send({ message: 'Bad Request' })
      }*/

      try {
        /*const result: PostImageContainerAPIResponse =
          existingContainer === null
            ? await createImageContainer(req.decodedAuth!.uid, containerID, files)
            : await appendImagesToContainer(req.decodedAuth!.uid, containerID, files)

        /*if ((await matchDraftPreviewWithContainer(containerID)).modifiedCount !== 1) {
          await matchListingPreviewWithContainer(containerID)
        }*/

        const createResult = await createImageContainer(req.decodedAuth!.uid, containerID, files)
        const result: PostImageContainerAPIResponse = imageContainerToDTO(createResult)

        return res.status(200).send(result)
      } catch (err) {
        if (err instanceof Error) return res.status(400).send({ message: err.message })
      }
    } catch (err) {
      next(err)
    }
  }
)

module.exports = router
