import express, { Application } from 'express'
import cors from 'cors'
import { EXPRESS_PORT, UPLOADS_PATH } from './constants/config'
import { errorHandler } from './middleware/errorHandler'
import { connectDB } from './database/database'
import { withInternalSecret } from './middleware/withInternalSecret'

const app: Application = express()

app.use(express.json())

app.use(
  cors({
    origin: '*',
    optionsSuccessStatus: 200,
  })
)

const startServer = async () => {
  await connectDB()

  app.use('/v1/image', require('./routes/v1/image'))
  app.use('/v1/internal', withInternalSecret, require('./routes/v1/internal'))
  app.use('/cdn', express.static(UPLOADS_PATH))

  console.log(`Serving static files from: ${UPLOADS_PATH}`)

  app.use(errorHandler)

  app.listen(EXPRESS_PORT, () => {
    console.log(`Server is running on ${EXPRESS_PORT} port.`)
  })
}

startServer()
