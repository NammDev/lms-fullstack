import express from 'express'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'
import {
  getCourseAnalytics,
  getOrderAnalytics,
  getUserAnalytics,
} from '../controller/analytics.controller'

const analyticsRouter = express.Router()

analyticsRouter.get(
  '/get-user-analytics',
  isAuthenticated,
  authorizeRoles('admin'),
  getUserAnalytics
)

analyticsRouter.get(
  '/get-course-analytics',
  isAuthenticated,
  authorizeRoles('admin'),
  getCourseAnalytics
)

analyticsRouter.get(
  '/get-order-analytics',
  isAuthenticated,
  authorizeRoles('admin'),
  getOrderAnalytics
)

export default analyticsRouter
