import { ObjectId } from "mongodb"

export type WithObjectID = {
  _id: ObjectId
}

export type WithOwner = {
  _owner: string
}

export type WithCreatedUpdatedDates = {
  _createdAt: number
  _updatedAt: number
  _updatedBy: string
}
