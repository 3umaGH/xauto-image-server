import * as fs from 'fs/promises'
import * as path from 'path'
import { bytesToMB } from '../util/util'
import { MAX_CONTAINER_FILES, MAX_CONTAINER_SIZE_MB, UPLOADS_PATH } from '../constants/config'

interface FileStats {
  totalFiles: number
  totalSize: number
}

interface DirectoryStats {
  [key: string]: FileStats
}

export async function getTotalFilesAndSize(dir: string): Promise<FileStats> {
  let totalFiles = 0
  let totalSize = 0
  const directoryStats: DirectoryStats = {}

  async function traverseDirectory(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true })
    let dirFiles = 0
    let dirSize = 0

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        await traverseDirectory(fullPath)
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath)
        totalFiles += 1
        totalSize += stats.size
        dirFiles += 1
        dirSize += stats.size
      }
    }

    directoryStats[currentPath] = { totalFiles: dirFiles, totalSize: dirSize }

    if (currentPath !== UPLOADS_PATH) {
      if (dirFiles > MAX_CONTAINER_FILES) {
        console.error(
          `[WARNING] More files than allowed (x${MAX_CONTAINER_FILES})! ${currentPath}: ${dirFiles} files, ${bytesToMB(
            dirSize
          ).toFixed(2)} MB`
        )
      }

      if (bytesToMB(dirSize) > MAX_CONTAINER_SIZE_MB) {
        console.error(
          `[WARNING] Bigger size than allowed (${MAX_CONTAINER_SIZE_MB}MB)! ${currentPath}: ${dirFiles} files, ${bytesToMB(
            dirSize
          ).toFixed(2)} MB`
        )
      }
    }
  }

  await traverseDirectory(dir)

  console.log(`Volume: ${totalFiles} files, ${bytesToMB(totalSize).toFixed(2)} MB`)
  return { totalFiles, totalSize }
}
