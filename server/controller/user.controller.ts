import { NextFunction, Request, Response } from 'express'
import userModel from '../models/user.model'
import { IUser } from '../models/user.model'
import ErrorHandler from '../utils/ErrorHandler'
import { CatchAsyncError } from '../middleware/catchAsyncError'
import jwt from 'jsonwebtoken'
import ejs from 'ejs'
import path from 'path'
import sendMail from '../utils/sendMail'
import { sendToken } from '../utils/jwt'
import { redis } from '../utils/redis'
require('dotenv').config()

// register User
interface IRegistrationBody {
  name: string
  email: string
  password: string
  avatar?: string
}

export const registrationUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body
      const isEmailExist = await userModel.findOne({ email })
      if (isEmailExist) {
        return next(new ErrorHandler(400, 'Email already exists'))
      }
      const user: IRegistrationBody = {
        name,
        email,
        password,
      }
      const { token, activationCode } = createActivationToken(user)
      const data = { user: { name: user.name }, activationCode }
      // const html = await ejs.renderFile(path.join(__dirname, '../mails/activation-mall.ejs'), data)

      try {
        await sendMail({
          email: user.email,
          subject: 'Active Your Account in NammDev',
          template: 'activation-mall.ejs',
          data,
        })
        res.status(201).json({
          success: true,
          message: `Please check your email ${user.email} to activate your account!`,
          activationToken: token,
        })
      } catch (error: any) {
        return next(new ErrorHandler(400, error.message))
      }
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message))
    }
  }
)

interface IActivationToken {
  token: string
  activationCode: string
}

export const createActivationToken = (user: IRegistrationBody): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString()
  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET_KEY,
    { expiresIn: '5m' }
  )
  return { token, activationCode }
}

// active user
interface IActivationRequest {
  activation_token: string
  activation_code: string
}

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } = req.body as IActivationRequest
      const decoded = jwt.verify(activation_token, process.env.ACTIVATION_SECRET_KEY)
      const { user, activationCode } = decoded as {
        user: IRegistrationBody
        activationCode: string
      }
      if (activation_code !== activationCode) {
        return next(new ErrorHandler(400, 'Incorrect activation code'))
      }

      const { name, email, password } = user
      const existUser = await userModel.findOne({ email })

      if (existUser) {
        return next(new ErrorHandler(400, 'Email already exists'))
      }

      const newUser = await userModel.create({
        name,
        email,
        password,
      })
      res.status(201).json({
        success: true,
        message: 'Account has been activated!',
      })
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message))
    }
  }
)

// Login User
interface ILoginRequest {
  email: string
  password: string
}

export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest
      if (!email || !password) {
        return next(new ErrorHandler(400, 'Please enter your email and password'))
      }
      const user = await userModel.findOne({ email }).select('+password')
      if (!user) {
        return next(new ErrorHandler(400, 'Invalid email or password'))
      }
      const isPasswordMatch = await user.comparePassword(password)
      if (!isPasswordMatch) {
        return next(new ErrorHandler(400, 'Invalid email or password'))
      }
      sendToken(user, 200, res)
    } catch (error) {
      return next(new ErrorHandler(400, error.message))
    }
  }
)

export const logoutUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie('accessToken', '', { maxAge: 1 })
      res.cookie('refreshToken', '', { maxAge: 1 })
      const userId = req.user._id
      redis.del(userId)

      res.status(200).json({
        success: true,
        message: 'Logged out successfully!',
      })
    } catch (error) {
      return next(new ErrorHandler(400, error.message))
    }
  }
)
