import express from 'express'

import { authorizeRoles, isAuthenticated } from '../middleware/auth'
import { getNotifications, updateNotification } from '../controller/notification.controller'

const notificationRouter = express.Router()

notificationRouter.get(
  '/get-notifications',
  isAuthenticated,
  authorizeRoles('admin'),
  getNotifications
)

notificationRouter.put(
  '/update-notification/:id',
  isAuthenticated,
  authorizeRoles('admin'),
  updateNotification
)
export default notificationRouter
