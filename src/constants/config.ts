import dotenv from 'dotenv'
dotenv.config()

export const EXPRESS_PORT = process.env.PORT || 8001
export const MONGO_DBNAME = 'Garaaz24'

export const IMAGE_CONTAINER_COLLETION = 'image-containers'

export const MAX_CONTAINER_SIZE_MB = 30
export const MAX_CONTAINER_FILES = 30

export const INTERNAL_SECRET_API_KEY = process.env.INTERNAL_API_KEY
export const INTERNAL_API_ADDRESS_URL = process.env.INTERNAL_API_ADDRESS_URL
export const IMAGE_SERVER_URL = process.env.IMAGE_SERVER_BASE_URL

export const UPLOADS_PATH = '/uploads'
