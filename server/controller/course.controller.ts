import cloudinary from 'cloudinary'
import { NextFunction, Request, Response } from 'express'

import { CatchAsyncError } from '../middleware/catchAsyncError'
import ErrorHandler from '../utils/ErrorHandler'
import { createCourse } from '../services/course.service'
import courseModel from '../models/course.model'
import { redis } from '../utils/redis'

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

// edit course
export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body
      const thumbnail = data.thumbnail
      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id)
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: 'courses',
        })
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        }
      }

      // get course ID
      const courseId = req.params.id
      const course = await courseModel.findByIdAndUpdate(courseId, { $set: data }, { new: true })
      res.status(201).json({
        success: true,
        course,
      })
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message))
    }
  }
)

// get single course -- without purchasing
export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id
      const isCacheExist = await redis.get(courseId)
      if (isCacheExist) {
        const course = JSON.parse(isCacheExist)
        res.status(200).json({
          success: true,
          course,
        })
      } else {
        const course = await courseModel
          .findById(req.params.id)
          .select(
            '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links'
          )
        await redis.set(courseId, JSON.stringify(course))
        res.status(200).json({
          success: true,
          course,
        })
      }
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message))
    }
  }
)

// get all course -- without purchasing
export const getAllCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExist = await redis.get('allCourses')
      if (isCacheExist) {
        const courses = JSON.parse(isCacheExist)
        res.status(200).json({
          success: true,
          courses,
        })
      } else {
        const courses = await courseModel
          .find()
          .select(
            '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links'
          )
        await redis.set('allCourses', JSON.stringify(courses))
        res.status(200).json({
          success: true,
          courses,
        })
      }
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message))
    }
  }
)
