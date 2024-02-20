'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import React, { useState } from 'react'
import NavItems from '../utils/NavItem'
import { ThemeSwitcher } from '../utils/ThemeSwitcher'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  activeItem: number
}

const Header = ({ open, setOpen, activeItem }: Props) => {
  const [active, setActive] = useState(false)
  const [openSidebar, setOpenSidebar] = useState(false)

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) {
        setActive(true)
      } else {
        setActive(false)
      }
    })
  }

  return (
    <div className='w-full relative'>
      <div
        className={
          (cn(
            active
              ? 'dark:bg-opacity-50 dark:bg-gradient-to-b dark:from-gray-900 dark:to-black fixed top-0 left-0 shadow-xl transition duration-500'
              : 'dark:shadow'
          ),
          'h-[80px] z-[80] w-full border-b dark:border-[#ffffff1c]')
        }
      >
        <div className='w-[95%] 800px:w-[92%] m-auto py-2 h-full'>
          <div className='w-full h-[80px] flex items-center justify-between p-3'>
            <div>
              <Link
                href={'/'}
                className={`text-[25px] font-Poppins font-[500] text-black dark:text-white`}
              >
                Elearning
              </Link>
            </div>
            <div className='flex items-center'>
              <NavItems activeItem={activeItem} isMobile={false} />
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
