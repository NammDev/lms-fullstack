import { NextFunction, Response } from 'express'
import { CatchAsyncError } from '../middleware/catchAsyncError'
import orderModel from '../models/order.model'

// create order
export const newOrder = CatchAsyncError(async (data: any, res: Response, next: NextFunction) => {
  const order = await orderModel.create(data)
  res.status(201).json({
    success: true,
    order,
  })
})
