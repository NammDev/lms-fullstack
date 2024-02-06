import { NextFunction, Request, Response } from 'express'

import { CatchAsyncError } from '../middleware/catchAsyncError'
import ErrorHandler from '../utils/ErrorHandler'
import notificationModel from '../models/notification.model'

// get notifications -- only for admin
export const getNotifications = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // new notification -> top
      const notifications = await notificationModel.find().sort({ createdAt: -1 })
      res.status(200).json({
        success: true,
        notifications,
      })
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message))
    }
  }
)
