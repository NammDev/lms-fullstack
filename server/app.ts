import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
require('dotenv').config()

export const app = express()

// body parse
app.use(express.json({ limit: '50mb' }))

// cookie parser
app.use(cookieParser())

// cors -> cross origin resource sharing
app.use(cors({ origin: process.env.ORIGIN }))

// testing api
app.get('/api/test', (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Api is working',
  })
})

// unknown route
app.all('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})
