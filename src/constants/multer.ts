import multer from 'multer'
import { MAX_CONTAINER_SIZE_MB } from './config'
import * as fs from 'fs'
import { getContainerOrNull } from '../database/operations/imageOperations'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destinationFolder = req.params.id || 'default'

    const uploadDir = `uploads/${destinationFolder}`

    fs.mkdir(uploadDir, { recursive: true }, (err: NodeJS.ErrnoException | null) => {
      if (err) return cb(err, uploadDir)

      cb(null, uploadDir)
    })
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '.webp')
  },
})

export const upload = multer({
  dest: 'uploads/',
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('File must be an image'))
    }

    cb(null, true)
  },

  limits: {
    fileSize: MAX_CONTAINER_SIZE_MB * 1024 * 1024,
  },
})
