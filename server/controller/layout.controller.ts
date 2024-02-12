import { NextFunction, Request, Response } from 'express'
import cloudinary from 'cloudinary'

import { CatchAsyncError } from '../middleware/catchAsyncError'
import ErrorHandler from '../utils/ErrorHandler'
import { Category, FaqItem, layoutModel } from '../models/layout.model'

// create layout
export const createLayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body

      const isTypeExist = await layoutModel.findOne({ type })
      if (isTypeExist) {
        return next(new ErrorHandler(400, 'Layout already exists'))
      }

      if (type === 'Banner') {
        const { image, title, subTitle } = req.body
        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: 'layout',
        })
        const banner = {
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          },
          title,
          subTitle,
        }
        await layoutModel.create({ type, banner })
      } else if (type === 'Faq') {
        const { faq } = req.body
        const faqItems = await Promise.all(
          faq.map(async (item: FaqItem) => {
            return { question: item.question, answer: item.answer }
          })
        )
        await layoutModel.create({ type: 'Faq', faq: faqItems })
      } else if (type === 'Categories') {
        const { categories } = req.body
        const categoryItems = await Promise.all(
          categories.map(async (item: Category) => {
            return { title: item.title }
          })
        )
        await layoutModel.create({ type: 'Categories', categories: categoryItems })
      }
      res.status(200).json({ success: true, message: 'Layout created successfully' })
    } catch (error: any) {
      next(new ErrorHandler(500, error.message))
    }
  }
)

// edit layout
export const editLayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body

      if (type === 'Banner') {
        const bannerData: any = await layoutModel.findOne({ type: 'Banner' })
        if (bannerData) await cloudinary.v2.uploader.destroy(bannerData.image.public_id)

        const { image, title, subTitle } = req.body

        // edit banner data: change Image, title, subtitle
      } else if (type === 'Faq') {
      } else if (type === 'Categories') {
      }
      res.status(200).json({ success: true, message: 'Layout created successfully' })
    } catch (error: any) {
      next(new ErrorHandler(500, error.message))
    }
  }
)
