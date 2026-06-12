
import MainPage from '@/src/components/MainPage'
import React from 'react'

import { createClient } from '@/src/lib/supabase/server'
import { redirect } from 'next/navigation'

const page = async() => {
  const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/Login')
  return (
    <div>
      <MainPage/>
    </div>
  )
}

export default page
