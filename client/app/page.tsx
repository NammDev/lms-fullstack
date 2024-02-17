'use client'

import Heading from './utils/Heading'

interface Props {}

const Page = (props: Props) => {
  return (
    <div>
      <Heading
        title='E Learning'
        description='E-Learning is a platform for students to learn and get help from teachers'
        keywords='programming,nextjs,mern,react,reactjs'
      />
      <h1>Page</h1>
    </div>
  )
}

export default Page
