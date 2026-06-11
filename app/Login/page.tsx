'use client'

import { createClient } from '@/src/lib/supabase/client'

import Link from 'next/link'
// import { FcGoogle } from 'react-icons/fc'       // Google
// import { FaTwitter } from 'react-icons/fa'     // Twitter
// import { FaGithub } from 'react-icons/fa'      // GitHub
import Image from 'next/image'
export default function LoginPage() {
  const supabase = createClient()

  async function signInWithGitHub() {
    await supabase.auth.signInWithOAuth({
      provider: 'github', 
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }
  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  return (
    <>
      <div className="p-4 bg-white/80">
        <Link href="/">
          <div className='flex items-center'>
                    <Image
                      src="/logo.png"   // file is at public/logo.png
                      alt="Documind Logo"
                      width={50}
                      height={50}
                    />
                    <span className="font-mono text-blue-500 md:text-lg">DocuMind</span>
          
                  </div>
        </Link>
      </div>

      <div className="md:min-h-screen bg-gray-50 flex items-center justify-center p-6 h-[80vh]">
        <div className="max-w-4xl w-full flex flex-col md:grid md:grid-cols-2 md:gap-6 gap-6 bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xl">

          {/* Left: Welcome / Branding */}
          <aside className="md:flex flex-col justify-center items-start p-8 bg-gradient-to-b from-blue-50 to-purple-50 border-r border-gray-200">
            <div className='flex items-center'>
                    <Image
                      src="/logo.png"   // file is at public/logo.png
                      alt="Documind Logo"
                      width={50}
                      height={50}
                    />
                    <span className="font-mono text-blue-500 md:text-lg">DocuMind</span>
          
                  </div>
            <h1 className="text-2xl font-extrabold mb-2 font-sans text-gray-900">
              AI answers from your documents.
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              Upload PDFs and ask questions in plain English. Get instant, context‑aware answers without scrolling through pages.
            </p>

            <div className="w-full">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Drag & drop PDFs to start querying</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Ask natural language questions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1 flex-shrink-0" />
                  <span className="text-gray-700">Get instant AI‑powered answers</span>
                </li>
              </ul>
            </div>

            <div className="mt-auto pt-8">
              <p className="font-mono text-xs text-gray-400">// built with Next.js + Supabase + Qdrant</p>
            </div>
          </aside>

          {/* Right: Auth Buttons */}
          <div className="flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100 gap-4 p-8">
            <button
              onClick={signInWithGitHub}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 cursor-pointer w-full"
            >
              Continue with GitHub
            </button>
            <button
              onClick={signInWithGoogle}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 cursor-pointer w-full"
            >
              Continue with Google
            </button>
          </div>
        </div>
      </div>


    </>
  )
}