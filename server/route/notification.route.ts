import express from 'express'

import { authorizeRoles, isAuthenticated } from '../middleware/auth'
import { getNotifications } from '../controller/notification.controller'

const notificationRouter = express.Router()

notificationRouter.get(
  '/get-notifications',
  isAuthenticated,
  authorizeRoles('admin'),
  getNotifications
)

export default notificationRouter
