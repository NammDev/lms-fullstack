import {
  addAnswer,
  addQuestion,
  addReview,
  getCourseByUser,
} from './../controller/course.controller'
import express from 'express'
import {
  editCourse,
  getAllCourse,
  getSingleCourse,
  uploadCourse,
} from '../controller/course.controller'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'

const courseRouter = express.Router()

courseRouter.post('/create-course', isAuthenticated, authorizeRoles('admin'), uploadCourse)
courseRouter.put('/edit-course/:id', isAuthenticated, authorizeRoles('admin'), editCourse)
courseRouter.get('/get-course/:id', getSingleCourse)
courseRouter.get('/get-courses', getAllCourse)
courseRouter.get('/get-course-content/:id', isAuthenticated, getCourseByUser)

courseRouter.put('/add-question', isAuthenticated, addQuestion)
courseRouter.put('/add-answer', isAuthenticated, addAnswer)
courseRouter.put('/add-review/:id', isAuthenticated, addReview)

export default courseRouter
