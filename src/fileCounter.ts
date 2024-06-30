import * as fs from 'fs/promises'
import * as path from 'path'

interface FileStats {
  totalFiles: number
  totalSize: number
}

export async function getTotalFilesAndSize(dir: string): Promise<FileStats> {
  let totalFiles = 0
  let totalSize = 0

  async function traverseDirectory(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        await traverseDirectory(fullPath)
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath)
        totalFiles += 1
        totalSize += stats.size
      }
    }
  }

  await traverseDirectory(dir)
  return { totalFiles, totalSize }
}
