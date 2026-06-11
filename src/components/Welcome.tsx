'use client'

import React from 'react'

import { useState, useEffect } from 'react'
import { easeInOut, motion } from 'framer-motion'
import LandingPage from './LandingPage'
import Image from 'next/image'
const Welcome = () => {
    const [loader, setloader] = useState(false)

    useEffect(() => {
        const timer : ReturnType<typeof setTimeout> = setTimeout(() => {
            setloader(true)
        }, 2000);
    
        return ()=>clearTimeout(timer)
    }, [])

    const container = (delay : number)=>({
        inital : {
            position : 'fixed',
            top : '50%',
            left : '50%',
            translateX : '-50%',
            translateY : '-50%',
            opacity : 1,
            scale : 3
        },
        animate : {
            top : loader ? '20px' : '50%',
            left : loader ? '20px' : '50%',
            translateX : loader ? 0 : '-50%',
            translateY : loader ? 0 : '-50%',
            opacity : loader ? 1 : 1,
            scale : loader ? 1 : 3,
            transition : {
                duration : delay,
                ease : easeInOut
            }
        }
    })
  return (
    <>
    <div className='bg-[#b6ccfe]'>
        <motion.div variants={container(1)} initial='initial' animate='animate' style={{zIndex : '50', position: 'fixed'}} className='px-1.5 md:px-7 md:py-1 py-4'>
             <div className='flex items-center justify-center'>
                     <Image 
                             src="/logo.png"   // file is at public/logo.png
                             alt="Documind Logo"
                             width={50}
                             height={50}
                           />
              <span className="font-mono text-blue-400 md:text-lg">DocuMind</span>
                     
                   </div>
        </motion.div>
    </div>
    <motion.div initial={{opacity : 0}} animate={{opacity : loader ? 1 : 0}} transition={{duration : 1, delay :1 }} style={{zIndex: '50'}}>
        <LandingPage/>
    </motion.div>
    </>
  )
}

export default Welcome
