import cloudinary from 'cloudinary'
import { NextFunction, Request, Response } from 'express'

import { CatchAsyncError } from '../middleware/catchAsyncError'
import ErrorHandler from '../utils/ErrorHandler'
import { createCourse } from '../services/course.service'

require('dotenv').config()

// upload course
export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      const thumbnail = data.thumbnail

      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: 'courses',
        })
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        }
      }

      createCourse(data, res, next)
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message))
    }
  }
)
