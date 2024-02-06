import express from 'express'
import {
  activateUser,
  loginUser,
  logoutUser,
  registrationUser,
  updateAccessToken,
  getAllUsers,
  getUserInfo,
  socialAuth,
  updatePassword,
  updateProfilePicture,
  updateUserInfo,
} from '../controller/user.controller'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'

const userRouter = express.Router()

userRouter.post('/registration', registrationUser)
userRouter.post('/activate-user', activateUser)
userRouter.post('/login', loginUser)
userRouter.get('/logout', isAuthenticated, logoutUser)
userRouter.get('/refresh-token', updateAccessToken)

userRouter.get('/me', isAuthenticated, getUserInfo)
userRouter.post('/social-auth', socialAuth)

userRouter.put('/update-profile', isAuthenticated, updateUserInfo)
userRouter.put('/update-password', isAuthenticated, updatePassword)
userRouter.put('/update-avatar', isAuthenticated, updateProfilePicture)

userRouter.get('/get-all-users', isAuthenticated, authorizeRoles('admin'), getAllUsers)

export default userRouter
