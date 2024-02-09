import { Request, Response, NextFunction } from 'express'

import ErrorHandler from '../utils/ErrorHandler'
import { CatchAsyncError } from '../middleware/catchAsyncError'
import { generateLast12MonthsData } from '../utils/analytics.generator'
import userModel from '../models/user.model'
import courseModel from '../models/course.model'
import orderModel from '../models/order.model'

// get user analytics -- only for admin
export const getUserAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await generateLast12MonthsData(userModel)
      res.status(200).json({
        success: true,
        users,
      })
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message))
    }
  }
)

// get course analytics -- only for admin
export const getCourseAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await generateLast12MonthsData(courseModel)
      res.status(200).json({
        success: true,
        courses,
      })
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message))
    }
  }
)

// get order analytics -- only for admin
export const getOrderAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await generateLast12MonthsData(orderModel)
      res.status(200).json({
        success: true,
        orders,
      })
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message))
    }
  }
)
