import mongoose, { Document, Model, Schema } from 'mongoose'
import { IUser } from './user.model'

interface ICommment extends Document {
  user: IUser
  question: string
  questionReplies?: ICommment[]
}

interface IReview extends Document {
  user: IUser
  rating: number
  comment: string
  commentReplies?: ICommment[]
}

interface ILink extends Document {
  title: string
  url: string
}

interface ICourseData extends Document {
  title: string
  description: string
  videoUrl: string
  videoSection: string
  videoLength: number
  videoPlayer: string
  links: ILink[]
  suggestion: string
  questions: ICommment[]
}

interface ICourse extends Document {
  name: string
  description: string
  price: number
  estimatedPrice: number
  thumbnail: object
  tags: string
  level: string
  demoUrl: string
  benefits: { title: string }[]
  prerequisites: { title: string }[]
  reviews: IReview[]
  courseData: ICourseData[]
  ratings?: number
  purchased: number
}

const reviewSchema = new Schema<IReview>({
  user: Object,
  rating: {
    type: Number,
    default: 0,
  },
  comment: String,
  commentReplies: [Object],
})

const linkSchema = new Schema<ILink>({
  title: String,
  url: String,
})

const commentSchema = new Schema<ICommment>({
  user: Object,
  question: String,
  questionReplies: [Object],
})

const courseDataSchema = new Schema<ICourseData>({
  title: String,
  description: String,
  videoUrl: String,
  videoSection: String,
  videoLength: Number,
  videoPlayer: String,
  links: [linkSchema],
  suggestion: String,
  questions: [commentSchema],
})

const courseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: [true, 'Please enter course name'],
    },
    description: {
      type: String,
      required: [true, 'Please enter course description'],
    },
    price: {
      type: Number,
      required: [true, 'Please enter course price'],
    },
    estimatedPrice: {
      type: Number,
    },
    thumbnail: {
      public_id: {
        type: String,
        // required: [true, 'Please upload course thumbnail'],
      },
      url: {
        type: String,
        // required: [true, 'Please upload course thumbnail'],
      },
    },
    tags: {
      type: String,
      required: [true, 'Please enter course tags'],
    },
    level: {
      type: String,
      required: [true, 'Please enter course level'],
    },
    demoUrl: {
      type: String,
      required: [true, 'Please enter course demo url'],
    },
    benefits: [
      {
        title: String,
      },
    ],
    prerequisites: [
      {
        title: String,
      },
    ],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings: {
      type: Number,
      default: 0,
    },
    purchased: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

const courseModel: Model<ICourse> = mongoose.model('Course', courseSchema)
export default courseModel
