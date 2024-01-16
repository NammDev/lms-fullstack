import { NextFunction, Request, Response, json } from 'express'
import userModel from '../models/user.model'
import { IUser } from '../models/user.model'
import ErrorHandler from '../utils/ErrorHandler'
import { CatchAsyncError } from '../middleware/catchAsyncError'
import jwt from 'jsonwebtoken'
import ejs from 'ejs'
import path from 'path'
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
      const activationToken = createActivationToken(user)
      const activationCode = activationToken.activationCode
      const data = { user: { name: user.name }, activationCode }
      const html = await ejs.renderFile(path.join(__dirname, '../mails/activation-mall.ejs'), data)

      try {
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
