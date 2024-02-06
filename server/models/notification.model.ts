import mongoose, { Document, Model, Schema } from 'mongoose'
import { IUser } from './user.model'

export interface INotification extends Document {
  title: string
  message: string
  status: string
  userId: string
}

const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: 'unread',
    },
    userId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
)

const notificationModel: Model<INotification> = mongoose.model('Notification', notificationSchema)
export default notificationModel
