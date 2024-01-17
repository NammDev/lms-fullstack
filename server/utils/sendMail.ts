import nodemailer, { Transporter } from 'nodemailer'
import ejs from 'ejs'
import path from 'path'

interface EmailOptions {
  email: string
  subject: string
  template: string
  data: { [key: string]: any }
}

const sendMail = async (options: EmailOptions): Promise<void> => {
  // uptodate
}
