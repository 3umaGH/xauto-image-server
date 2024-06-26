import multer from 'multer'
import { MAX_CONTAINER_SIZE_MB, UPLOADS_PATH } from './config'
import * as fs from 'fs'

const storage = multer.diskStorage({
  destination: function (req, _, cb) {
    const destinationFolder = req.params.id || 'default'

    const uploadDir = `${UPLOADS_PATH}/${destinationFolder}`

    fs.mkdir(uploadDir, { recursive: true }, (err: NodeJS.ErrnoException | null) => {
      if (err) return cb(err, uploadDir)

      cb(null, uploadDir)
    })
  },
  filename: function (_, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '.webp')
  },
})

export const upload = multer({
  dest: UPLOADS_PATH,
  storage: storage,
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('File must be an image'))
    }

    cb(null, true)
  },

  limits: {
    fileSize: MAX_CONTAINER_SIZE_MB * 1024 * 1024,
  },
})
