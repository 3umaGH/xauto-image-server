import sharp from 'sharp'
import fs from 'fs'

const WATERMARK = './src/assets/watermark.png'
const RETRY_INTERVAL_MS = 1000
const MAX_RETRIES = 3

/**
 * Optimizes an image by resizing it to a specified width, converting it to WebP format with the given quality,
 * and replacing the original file with the optimized version. Retries the optimization process if the file is
 * locked or in use, up to a maximum number of retries.
 * @param {string} path - The path to the image file to optimize.
 * @returns {Promise<number>} A Promise that resolves with the size of the optimized image file in megabytes.
 * @throws {Error} Throws an error if the optimization process fails after the maximum number of retries.
 */
export const optimizeImage = async (path: string): Promise<number> => {
  let retries = 0

  while (retries < MAX_RETRIES) {
    try {
      const image = sharp(path)
      const metadata = await image.metadata()

      const compositeJob = []

      compositeJob.push({
        input: WATERMARK,
        gravity: 'southeast',
      })

      if (metadata.width ?? 0 > 1000) {
        compositeJob.push({
          input: WATERMARK,
          gravity: 'southwest',
        })
      }

      await sharp(path)
        .rotate()
        .resize({ height: 920, fit: 'cover' })
        .composite(compositeJob)
        .webp({ quality: 70 })
        .toFile(`${path}-temp`)

      const stats = await fs.promises.stat(`${path}-temp`)
      const file_size = stats.size

      await fs.promises.rename(`${path}-temp`, path)

      return file_size
    } catch (error) {
      if (
        error instanceof Error &&
        ((error as NodeJS.ErrnoException).code === 'EPERM' || (error as NodeJS.ErrnoException).code === 'EBUSY')
      ) {
        console.warn(`File ${path} is locked or in use. Retrying in ${RETRY_INTERVAL_MS} milliseconds...`)
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MS))
        retries++
      } else {
        // Rethrow other errors
        throw error
      }
    }
  }

  // Maximum retries reached
  throw new Error(`Failed to optimize image: maximum retries (${MAX_RETRIES}) exceeded.`)
}
