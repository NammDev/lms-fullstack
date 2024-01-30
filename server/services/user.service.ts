import { NextFunction, Response } from 'express'
import { CatchAsyncError } from '../middleware/catchAsyncError'
import userModel from '../models/user.model'
import ErrorHandler from '../utils/ErrorHandler'

// get user by ID
export const getUserById = async (id: string, res: Response) => {
  const user = await userModel.findById(id)
  res.status(201).json({
    success: true,
    user,
  })
}
