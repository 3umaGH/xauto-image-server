import dotenv from 'dotenv'
import { Db, MongoClient } from 'mongodb'
import { MONGO_DBNAME } from '../constants/config'

dotenv.config()

export let db: Db
export let mongoClient: MongoClient

export const connectDB = async () => {
  if (!db) {
    if (!process.env.MONGO_URI) throw new Error('Mongo URI not provided in enviroment variables.')

    mongoClient = new MongoClient(process.env.MONGO_URI)

    try {
      await mongoClient.connect()
      db = mongoClient.db(MONGO_DBNAME)

      console.log('Connected to MongoDB server')
    } catch (error) {
      console.error('Error connecting to MongoDB:', error)
      process.exit(1)
    }
  }
}
