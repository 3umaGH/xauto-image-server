import { db } from '../database'
import { ObjectId } from 'mongodb'
import fs from 'fs'
import { Image, ImageContainer } from '../../types/image'
import { optimizeImage } from '../../optimizer'
import { getTotalFileSize, mapFilesToListingImages } from '../../util/imageUtils'
import { IMAGE_CONTAINER_COLLETION, MAX_CONTAINER_FILES } from '../../constants/config'

const col = db.collection(IMAGE_CONTAINER_COLLETION)

export const getContainerOrNull = async (id: ObjectId) => {
  const container = (await col.findOne({ _id: id })) as ImageContainer | null

  return container
}

export const getContainer = async (id: ObjectId) => {
  const container = await getContainerOrNull(id)

  if (container === null) {
    throw new Error('Container does not exist')
  }

  return container
}
const optimizeContainerImages = async (id: ObjectId) => {
  const container = await getContainer(id)
  const unprocessedImages = container.images.filter(img => img.status === 'OPTIMIZING')

  return Promise.all(
    unprocessedImages.map(async img => {
      try {
        const newFileSize = await optimizeImage(img.local_path)

        col.updateOne(
          { _id: id, 'images.id': img.id },
          { $set: { 'images.$.status': 'DONE', 'images.$.size': newFileSize } }
        )
      } catch (err) {
        if (err instanceof Error) {
          await fs.promises.rm(img.local_path)

          col.updateOne(
            { _id: id, 'images.id': img.id },
            { $set: { 'images.$.status': 'ERROR', 'images.$.error': err.message } }
          )
        }
      }
    })
  )
}

export const createImageContainer = async (
  authUID: string,
  id: ObjectId,
  initialFiles: Express.Multer.File[]
): Promise<ImageContainer> => {
  if (initialFiles.length > MAX_CONTAINER_FILES) {
    throw new Error(`Maximum of ${MAX_CONTAINER_FILES} files is allowed`)
  }

  const dataObj = {
    total_size: getTotalFileSize(initialFiles),
    images: mapFilesToListingImages(id.toString(), initialFiles),

    _owner: authUID,
    _createdAt: new Date().getTime(),
    _updatedAt: new Date().getTime(),
    _updatedBy: authUID,
  }

  await col.insertOne({ _id: id, ...dataObj })

  optimizeContainerImages(id).then(() => {
    updateTotalContainerSize(id)
  })

  return dataObj
}

const updateTotalContainerSize = async (id: ObjectId) => {
  const container = await getContainer(id)
  const newSize = container.images.reduce((acc: number, image: Image) => (acc += image.size), 0)

  return col.updateOne({ _id: id }, { $set: { total_size: newSize } })
}
