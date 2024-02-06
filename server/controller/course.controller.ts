import cloudinary from 'cloudinary'
import { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'

import { CatchAsyncError } from '../middleware/catchAsyncError'
import ErrorHandler from '../utils/ErrorHandler'
import { createCourse, getAllCoursesService } from '../services/course.service'
import courseModel from '../models/course.model'
import { redis } from '../utils/redis'
import sendMail from '../utils/sendMail'
import notificationModel from '../models/notification.model'

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

// get course content - only for valid user
export const getCourseByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses
      const courseId = req.params.id
      const courseExist = userCourseList?.find((c: any) => c._id.toString() === courseId)
      if (!courseExist) {
        return next(new ErrorHandler(400, 'You have not purchased this course'))
      }
      const course = await courseModel.findById(courseId)
      const content = course?.courseData
      res.status(200).json({
        success: true,
        content,
      })
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message))
    }
  }
)

// add questions in course
interface IAddQuestionData {
  question: string
  courseId: string
  contentId: string
}
export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId } = req.body as IAddQuestionData
      const course = await courseModel.findById(courseId)

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler(400, 'Invalid content ID 1'))
      }

      const courseContent = course?.courseData.find((item: any) => item._id.equals(contentId))
      if (!courseContent) {
        return next(new ErrorHandler(400, 'Invalid content ID 2'))
      }

      // create a new questions object
      const newQuestions: any = {
        user: req.user,
        question,
        questionReplies: [],
      }

      // add this question to our courseContent
      courseContent.questions.push(newQuestions)

      // send notification to admin (hey, new question from user)
      await notificationModel.create({
        userId: req.user?._id,
        title: 'New Question Received',
        message: `Hey, you have new question in ${courseContent.title}`,
      })

      // save the updated course
      await course?.save()

      res.status(201).json({
        success: true,
        course,
      })
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message))
    }
  }
)

// add answer in course question
interface IAddAnswerData {
  answer: string
  courseId: string
  contentId: string
  questionId: string
}
export const addAnswer = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData = req.body
      const course = await courseModel.findById(courseId)

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler(400, 'Invalid content ID 1'))
      }

      const courseContent = course?.courseData.find((item: any) => item._id.equals(contentId))
      if (!courseContent) {
        return next(new ErrorHandler(400, 'Invalid content ID 2'))
      }

      const question = courseContent.questions.find((item: any) => item._id.equals(questionId))
      if (!question) {
        return next(new ErrorHandler(400, 'Invalid question ID'))
      }

      // create a new answer object
      const newAnswer: any = {
        user: req.user,
        answer,
      }

      // add this answer to our course content (question)
      question.questionReplies.push(newAnswer)

      await course?.save()

      if (req.user._id === question.user?._id) {
        // create a notification
        await notificationModel.create({
          userId: req.user._id,
          title: 'New Question Reply Received',
          message: `Hey, you have new reply in ${courseContent.title}`,
        })
      } else {
        // send email to the user
        const data = {
          name: question.user.name,
          title: courseContent.title,
        }
        try {
          await sendMail({
            email: question?.user.email,
            subject: 'Question Reply',
            template: 'question-reply.ejs',
            data,
          })
        } catch (error: any) {
          return next(new ErrorHandler(500, error.message))
        }
      }

      res.status(200).json({
        success: true,
        course,
      })
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message))
    }
  }
)

// add review in course
interface IAddReviewData {
  review: string
  rating: number
}
export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses
      const courseId = req.params.id

      // check if courseId already exist in userCourseList
      const courseExist = userCourseList?.find((c: any) => c._id.toString() === courseId.toString())
      if (!courseExist) {
        return next(new ErrorHandler(400, 'You have not purchased this course'))
      }

      const course = await courseModel.findById(courseId)

      const { review, rating }: IAddReviewData = req.body

      const reviewData: any = {
        user: req.user,
        comment: review,
        rating,
      }
      course?.reviews.push(reviewData)

      // cal rating number based on review
      let avg = 0
      course?.reviews.forEach((rev: any) => {
        avg += rev.rating
      })
      if (course) course.ratings = avg / course?.reviews.length

      await course.save()

      const notification = {
        title: 'New Review Received',
        message: `${req.user.name} has given a review on ${course.name}`,
      }

      // create notification
      res.status(200).json({ success: true, course })
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message))
    }
  }
)

// add reply in review
interface IAddReplyData {
  comment: string
  courseId: string
  reviewId: string
}
export const addReply = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { comment, courseId, reviewId }: IAddReplyData = req.body
    const course = await courseModel.findById(courseId)
    if (!course) return next(new ErrorHandler(400, 'Invalid course ID'))

    const review = course.reviews.find((item: any) => item._id.equals(reviewId))
    if (!review) return next(new ErrorHandler(400, 'Invalid review ID'))

    const replyData: any = {
      user: req.user,
      comment,
    }
    if (!review.commentReplies) review.commentReplies = []
    review.commentReplies.push(replyData)
    await course?.save()

    res.status(200).json({ success: true, course })
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message))
  }
})

// get all courses -- only for admin
export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res)
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message))
    }
  }
)

// delete course -- only for admin
export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const course = await courseModel.findById(id)
      if (!course) {
        return next(new ErrorHandler(404, 'Course not found'))
      }
      await course.deleteOne({ id })
      await redis.del(id)

      res.status(200).json({
        success: true,
        message: 'Course has been deleted!',
      })
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message))
    }
  }
)
