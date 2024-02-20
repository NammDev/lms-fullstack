'use client'

import { useState } from 'react'
import Header from '../components/Header'
import Heading from '../utils/Heading'

interface Props {}

const Page = (props: Props) => {
  const [open, setOpen] = useState(false)
  const [activeItem, setActiveItem] = useState(0)
  return (
    <div>
      <Heading
        title='E Learning'
        description='E-Learning is a platform for students to learn and get help from teachers'
        keywords='programming,nextjs,mern,react,reactjs'
      />
      <Header open={open} setOpen={setOpen} activeItem={activeItem} />
    </div>
  )
}

export default Page
