import jwt, { JwtPayload } from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { CatchAsyncError } from './catchAsyncError'
import ErrorHandler from '../utils/ErrorHandler'
import userModel from '../models/user.model'
import { redis } from '../utils/redis'
require('dotenv').config()

// authenticated user
export const isAuthenticated = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies.accessToken
    if (!accessToken) {
      return next(new ErrorHandler(401, 'Please login to access this resource'))
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN || '') as JwtPayload
    if (!decoded) {
      return next(new ErrorHandler(401, 'Access Token is not valid'))
    }

    const user = await redis.get(decoded.id)
    if (!user) {
      return new ErrorHandler(401, 'User not found')
    }

    req.user = JSON.parse(user)
    next()
  }
)

// validate user role
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role) || '') {
      return next(
        new ErrorHandler(403, `Role (${req.user?.role}) is not allowed to access this resource`)
      )
    }
    next()
  }
}
