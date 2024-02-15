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
        return next(new ErrorHandler(400, 'Layout already exists! Please edit it instead.'))
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
        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: 'layout',
        })
        const banner = {
          type: 'Banner',
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          },
          title,
          subTitle,
        }
        await layoutModel.findByIdAndUpdate(bannerData._id, { banner })
      } else if (type === 'Faq') {
        const { faq } = req.body
        const faqItemData = await layoutModel.findOne({ type: 'Faq' })
        const faqItems = await Promise.all(
          faq.map(async (item: FaqItem) => {
            return { question: item.question, answer: item.answer }
          })
        )
        await layoutModel.findByIdAndUpdate(faqItemData._id, { type: 'Faq', faq: faqItems })
      } else if (type === 'Categories') {
        const { categories } = req.body
        const categoriesData = await layoutModel.findOne({ type: 'Categories' })
        const categoryItems = await Promise.all(
          categories.map(async (item: Category) => {
            return { title: item.title }
          })
        )
        await layoutModel.findByIdAndUpdate(categoriesData._id, {
          type: 'Categories',
          categories: categoryItems,
        })
      }
      res.status(200).json({ success: true, message: 'Layout Updated successfully' })
    } catch (error: any) {
      next(new ErrorHandler(500, error.message))
    }
  }
)

// get layout by type
export const getLayoutByType = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body
      const layout = await layoutModel.findOne({ type })
      res.status(201).json({ success: true, layout })
    } catch (error: any) {
      next(new ErrorHandler(500, error.message))
    }
  }
)
