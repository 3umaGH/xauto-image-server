import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { createImageContainer, deleteContainer } from '../../database/operations/imageOperations'

const express = require('express')
const router = express.Router()

router.post('/container/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const containerID = new ObjectId(req.params.id)

    await createImageContainer(req.body.ownerId, containerID, [])
    console.log(`New image container created by ${req.body.ownerId}`)

    return res.sendStatus(200)
  } catch (err) {
    next(err)
  }
})

router.delete('/container/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const containerID = new ObjectId(req.params.id)

    await deleteContainer(containerID)
    console.log(`Image container ${containerID} has been deleted.`)

    return res.sendStatus(200)
  } catch (err) {
    next(err)
  }
})

module.exports = router
