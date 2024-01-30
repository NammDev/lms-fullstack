require('dotenv').config()
import { Response } from 'express'
import { IUser } from '../models/user.model'
import { redis } from './redis'

export interface ITokenOptions {
  expires: Date
  maxAge: number
  httpOnly: boolean
  sameSite: 'lax' | 'strict' | 'none' | undefined
  secure?: boolean
}

// parse env variables to integrates with fallback values
export const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10)
export const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200', 10)

// options for cookies
export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
}

export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
}

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.signAccessToken()
  const refreshToken = user.signRefreshToken()

  // upload sessions to redis (upstash)
  redis.set(user._id, JSON.stringify(user) as any)

  // only set secure to true in production
  if (process.env.NODE_ENV === 'production') {
    accessTokenOptions.secure = true
  }

  res.cookie('accessToken', accessToken, accessTokenOptions)
  res.cookie('refreshToken', refreshToken, refreshTokenOptions)

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  })
}
