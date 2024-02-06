import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import cloudinary from 'cloudinary'
require('dotenv').config()

import ErrorHandler from '../utils/ErrorHandler'
import { CatchAsyncError } from '../middleware/catchAsyncError'

import userModel from '../models/user.model'
import sendMail from '../utils/sendMail'
import { accessTokenOptions, refreshTokenOptions, sendToken } from '../utils/jwt'
import { redis } from '../utils/redis'
import { getUserById } from '../services/user.service'

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
      return next(new ErrorHandler(404, error.message))
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

// update access token
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refreshToken as string
      const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload
      if (!decoded) {
        return next(new ErrorHandler(400, 'Could not refresh token'))
      }
      const session = await redis.get(decoded.id as string)
      if (!session) {
        return next(new ErrorHandler(400, 'Could not refresh token'))
      }
      const user = JSON.parse(session)
      const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN || '', {
        expiresIn: '5m',
      })
      const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN || '', {
        expiresIn: '7d',
      })

      req.user = user

      res.cookie('accessToken', accessToken, accessTokenOptions)
      res.cookie('refreshToken', refreshToken, refreshTokenOptions)

      // send respond
      res.status(200).json({
        success: true,
        accessToken,
      })
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message))
    }
  }
)

export const getUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id
      getUserById(userId as string, res)
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message))
    }
  }
)

interface ISocialAuthBody {
  email: string
  name: string
  avatar: string
}

// social auth
export const socialAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthBody
      const user = await userModel.findOne({ email })
      if (!user) {
        const newUser = await userModel.create({
          name,
          email,
          avatar,
        })
        sendToken(newUser, 200, res)
      } else {
        sendToken(user, 200, res)
      }
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message))
    }
  }
)

// update user info
interface IUpdateUserInfo {
  name?: string
  email?: string
}

export const updateUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name } = req.body as IUpdateUserInfo
      const userId = req.user?._id
      const user = await userModel.findById(userId)
      if (email && user) {
        const isEmailExist = await userModel.findOne({ email })
        if (isEmailExist) {
          return next(new ErrorHandler(400, 'Email already exists'))
        }
        user.email = email
      }
      if (name && user) {
        user.name = name
      }
      await user?.save()
      await redis.set(userId as string, JSON.stringify(user) as any)
      res.status(200).json({
        success: true,
        user,
      })
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message))
    }
  }
)

interface IUpdatePassword {
  oldPassword: string
  newPassword: string
}

export const updatePassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdatePassword
      if (!oldPassword || !newPassword) {
        return next(new ErrorHandler(400, 'Please enter old password and new password'))
      }
      const user = await userModel.findById(req.user?._id).select('+password')

      if (user?.password === undefined) {
        return next(new ErrorHandler(400, 'Invalid user'))
      }
      const isPasswordMatch = await user.comparePassword(oldPassword)
      if (!isPasswordMatch) {
        return next(new ErrorHandler(400, 'Old password is incorrect'))
      }
      user.password = newPassword
      await user.save()
      await redis.set(req.user._id, JSON.stringify(user) as any)
      res.status(200).json({
        success: true,
        user,
      })
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message))
    }
  }
)

// update profile picture
interface IUpdateProfilePicture {
  avatar: string
}

export const updateProfilePicture = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body as IUpdateProfilePicture
      const userId = req.user?._id
      const user = await userModel.findById(userId)
      if (user && avatar) {
        user?.avatar?.public_id && (await cloudinary.v2.uploader.destroy(user?.avatar?.public_id))
        // upload the new image
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: 'avatars',
          width: 150,
        })
        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        }
      }
      await user?.save()
      await redis.set(userId as string, JSON.stringify(user) as any)
      res.status(200).json({
        success: true,
        user,
      })
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message))
    }
  }
)
