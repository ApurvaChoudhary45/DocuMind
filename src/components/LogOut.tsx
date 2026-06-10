'use client'

import { createClient } from '../lib/supabase/client'

import { useRouter } from 'next/navigation'

const LogOut = () => {

    const supabase = createClient() 
    const router = useRouter()

    const handleLogOut = async ()=>{
        await supabase.auth.signOut()
        router.push('/Login')
    }

  return (
    <div>
      <button onClick={handleLogOut} className='text-white rounded-xl p-2 md:text-md text-sm bg-purple-500 cursor-pointer'>Log Out</button>
    </div>
  )
}

export default LogOut
