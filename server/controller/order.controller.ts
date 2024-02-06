import { NextFunction, Request, Response } from 'express'

import { CatchAsyncError } from '../middleware/catchAsyncError'
import ErrorHandler from '../utils/ErrorHandler'
import { IOrder } from '../models/order.model'
import userModel from '../models/user.model'
import courseModel from '../models/course.model'
import { getAllOrdersService, newOrder } from '../services/order.service'
import sendMail from '../utils/sendMail'
import notificationModel from '../models/notification.model'

// create order
export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_info } = req.body as IOrder
      const user = await userModel.findById(req.user._id)

      const courseExist = user?.courses.some((course: any) => course._id.toString() === courseId)
      if (courseExist) return next(new ErrorHandler(400, 'You already enrolled this course'))

      const course = await courseModel.findById(courseId)
      if (!course) return next(new ErrorHandler(404, 'Course not found'))

      // create order
      const data: any = {
        courseId: course._id,
        userId: user?._id,
      }

      // sending mail
      const mailData = {
        order: {
          _id: course._id.toString().slice(0, 6),
          name: course.name,
          price: course.price,
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        },
      }
      try {
        if (user) {
          await sendMail({
            email: user.email,
            subject: 'Order Confirmation',
            template: 'order-confirmation.ejs',
            data: mailData,
          })
        }
      } catch (error: any) {
        return next(new ErrorHandler(500, error.message))
      }

      // add course to user
      user.courses.push(course._id)
      await user.save()

      // send notification to admin (hey, new order from user)
      await notificationModel.create({
        userId: user._id,
        title: 'New Order',
        message: `Hey, new order from user ${user.name} for the course ${course.name}}`,
      })

      course.purchased ? (course.purchased += 1) : course.purchased
      await course.save()

      newOrder(data, res, next)
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message))
    }
  }
)

// get all orders -- only for admin
export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllOrdersService(res)
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message))
    }
  }
)
