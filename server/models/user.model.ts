import mongoose, { Document, Model, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
require('dotenv').config()

const emailRegexPattern: RegExp = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/

export interface IUser extends Document {
  name: string
  email: string
  password: string
  avatar: {
    public_id: string
    url: string
  }
  role: string
  isVerified: boolean
  courses: Array<{ courseId: string }>
  comparePassword: (password: string) => Promise<boolean>
  signAccessToken: () => string
  signRefreshToken: () => string
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your name'],
    },
    email: {
      type: String,
      required: [true, 'Please enter your email'],
      unique: true,
      match: [emailRegexPattern, 'Please enter valid email address'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: String,
      },
    ],
  },
  { timestamps: true }
)

// Hash Password before saving
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// sign access token
userSchema.methods.signAccessToken = function (): string {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || '', { expiresIn: '5m' })
}

userSchema.methods.signRefreshToken = function (): string {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || '', { expiresIn: '7d' })
}

// compare password
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password)
}

const userModel: Model<IUser> = mongoose.model<IUser>('User', userSchema)
export default userModel
