import fs from 'fs'
import { Collection, ObjectId } from 'mongodb'
import { IMAGE_CONTAINER_COLLETION, MAX_CONTAINER_FILES } from '../../constants/config'
import { handleCompareImages } from '../../routes/v1/image'
import { optimizeImage } from '../../services/optimizer'
import { OwnerType } from '../../types/common'
import { ImageContainer } from '../../types/image'
import { calculateContainerSize, getTotalFileSize, mapFilesToListingImages } from '../../util/imageUtils'
import { db } from '../database'

const col: Collection<ImageContainer> = db.collection(IMAGE_CONTAINER_COLLETION)

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

        await col.updateOne(
          { _id: id, 'images.id': img.id },
          { $set: { 'images.$.status': 'DONE', 'images.$.size': newFileSize } }
        )
      } catch (err) {
        if (err instanceof Error) {
          try {
            await fs.promises.rm(img.local_path)
          } catch {}

          await col.updateOne(
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
  ownerType: OwnerType,
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
    _owner_type: ownerType,
    _createdAt: new Date().getTime(),
    _updatedAt: new Date().getTime(),
    _updatedBy: authUID,
  }

  const result = await col.insertOne({ _id: id, ...dataObj })

  optimizeContainerImages(id).then(() => {
    updateTotalContainerSize(id)
  })

  return { _id: result.insertedId, ...dataObj }
}

export const appendImagesToContainer = async (authUID: string, id: ObjectId, files: Express.Multer.File[]) => {
  const container = await getContainer(id)
  const mappedImages = mapFilesToListingImages(id.toString(), files)

  const orderedImages = [...container.images, ...mappedImages].map((image, index) => ({
    ...image,
    order: index,
  }))

  const dataObj: ImageContainer = {
    ...container,
    images: orderedImages,
    total_size: orderedImages.reduce((acc: number, image) => (acc += image.size), 0),

    _updatedBy: authUID,
    _updatedAt: new Date().getTime(),
  }

  await col.updateOne({ _id: id }, { $set: { ...dataObj } })

  optimizeContainerImages(id).then(() => {
    handleCompareImages(container, dataObj)
    updateTotalContainerSize(id)
  })

  return dataObj
}

const updateTotalContainerSize = async (id: ObjectId) => {
  const container = await getContainer(id)
  const newSize = calculateContainerSize(container)

  return col.updateOne({ _id: id }, { $set: { total_size: newSize } })
}

export const deleteContainer = async (id: ObjectId) => {
  const container = await getContainer(id)

  container.images.forEach(image => {
    fs.promises.unlink(image.local_path).catch(err => {
      console.log('Failed deleting image on container deletion, err:', err)
    })

    fs.promises.unlink(image.local_path.replace('.webp', '-thumb.webp')).catch(err => {
      console.log('Failed deleting thumbnail image on container deletion, err:', err)
    })
  })

  return col.deleteOne({ _id: id })
}

export const deleteImageFromContainer = async (authUID: string, container: ImageContainer, imageId: string) => {
  let images = container.images
  const targetIndex = images.findIndex(img => img.id === imageId)

  if (targetIndex === -1) throw new Error('Image not found')

  fs.promises.unlink(images[targetIndex].local_path).catch(() => {})
  fs.promises.unlink(images[targetIndex].local_path.replace('.webp', '-thumb.webp')).catch(() => {})

  images = images.filter(img => img.id !== imageId).map((image, index) => ({ ...image, order: index }))

  const updatedContainer: ImageContainer = {
    ...container,
    images: images.sort((a, b) => a.order - b.order),
    _updatedBy: authUID,
    _updatedAt: new Date().getTime(),
  }

  await col.updateOne(
    { _id: container._id },
    { $set: { ...updatedContainer, total_size: calculateContainerSize(updatedContainer) } }
  )

  return updatedContainer
}

export const imageChangeOrder = async (
  authUID: string,
  container: ImageContainer,
  imageId: string,
  newOrder: number
) => {
  let images = [...container.images]
  const targetIndex = images.findIndex(img => img.id === imageId)

  if (targetIndex === -1) throw new Error('Image not found')
  if (targetIndex === newOrder) return container

  const removedItem = images.splice(targetIndex, 1)[0]
  images.splice(newOrder, 0, removedItem)

  const updatedContainer: ImageContainer = {
    ...container,
    images: images.map((img, index) => ({ ...img, order: index })),
    _updatedBy: authUID,
    _updatedAt: new Date().getTime(),
  }
  await col.updateOne({ _id: container._id }, { $set: updatedContainer })

  return updatedContainer
}
