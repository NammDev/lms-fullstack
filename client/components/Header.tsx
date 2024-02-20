'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import React, { useState } from 'react'
import NavItems from '../utils/NavItem'
import { ThemeSwitcher } from '../utils/ThemeSwitcher'
import Image from 'next/image'
import { HiOutlineMenuAlt3, HiOutlineUserCircle } from 'react-icons/hi'
import avatar from '@/public/assests/avatar.png'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  activeItem: number
}

const Header = ({ open, setOpen, activeItem }: Props) => {
  const [active, setActive] = useState(false)
  const [openSidebar, setOpenSidebar] = useState(false)

  const userData: any = {}

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) {
        setActive(true)
      } else {
        setActive(false)
      }
    })
  }

  const handleClose = (e: any) => {
    if (e.target.id === 'screen') {
      {
        setOpenSidebar(false)
      }
    }
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
              {/* only for mobile */}
              <div className='800px:hidden'>
                <HiOutlineMenuAlt3
                  size={25}
                  className='cursor-pointer dark:text-white text-black'
                  onClick={() => setOpenSidebar(true)}
                />
              </div>
              {/* User Profile */}
              {userData?.user ? (
                <Link href={'/profile'}>
                  <Image
                    src={userData?.user.avatar ? userData.user.avatar.url : avatar}
                    alt=''
                    width={30}
                    height={30}
                    className='w-[30px] h-[30px] rounded-full cursor-pointer'
                    style={{ border: activeItem === 5 ? '2px solid #37a39a' : 'none' }}
                  />
                </Link>
              ) : (
                <HiOutlineUserCircle
                  size={25}
                  className='hidden 800px:block cursor-pointer dark:text-white text-black'
                  onClick={() => setOpen(true)}
                />
              )}
            </div>
          </div>
        </div>

        {/* mobile sidebar */}
        {openSidebar && (
          <div
            className='fixed w-full h-screen top-0 left-0 z-[99999] dark:bg-[unset] bg-[#00000024]'
            onClick={handleClose}
            id='screen'
          >
            <div className='w-[70%] fixed z-[999999999] h-screen bg-white dark:bg-slate-900 dark:bg-opacity-90 top-0 right-0'>
              <NavItems activeItem={activeItem} isMobile={true} />
              {userData?.user ? (
                <Link href={'/profile'}>
                  <Image
                    src={userData?.user.avatar ? userData.user.avatar.url : avatar}
                    alt=''
                    width={30}
                    height={30}
                    className='w-[30px] h-[30px] rounded-full ml-[20px] cursor-pointer'
                    style={{ border: activeItem === 5 ? '2px solid #37a39a' : 'none' }}
                  />
                </Link>
              ) : (
                <HiOutlineUserCircle
                  size={25}
                  className='hidden 800px:block cursor-pointer dark:text-white text-black'
                  onClick={() => setOpen(true)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Header