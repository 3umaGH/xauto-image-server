import express, { Request, Response, Application, NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import { EXPRESS_PORT } from './constants/config'

const app: Application = express()

app.use(express.json())

app.use(
  cors({
    origin: '*',
    optionsSuccessStatus: 200,
  })
)

app.listen(EXPRESS_PORT, () => {
    console.log(`Server is running on ${EXPRESS_PORT} port.`)
  })