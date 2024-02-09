import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
require('dotenv').config()

import { ErrorMiddleware } from './middleware/error'

import userRouter from './route/user.route'
import courseRouter from './route/course.route'
import orderRouter from './route/order.route'
import notificationRouter from './route/notification.route'
import analyticsRouter from './route/analytic.route'

export const app = express()

// body parse
app.use(express.json({ limit: '50mb' }))

// cookie parser
app.use(cookieParser())

// cors -> cross origin resource sharing
app.use(cors({ origin: process.env.ORIGIN }))

// routes
app.use('/api/v1', userRouter, courseRouter, orderRouter, notificationRouter, analyticsRouter)

// testing api
app.get('/test', (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Api is working',
  })
})

// unknown route
app.all('*', (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found!`) as any
  err.statusCode = 404
  next(err)
})

app.use(ErrorMiddleware)
