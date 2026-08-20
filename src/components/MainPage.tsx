// src/app/page.tsx
// The main page — connects DocumentUploader and ChatInterface.
// Holds the uploadedDoc state so both components can share it.
// When uploader finishes → stores the result → passes to chat.

'use client'

import { useState } from 'react'
import { UploadResponse } from '@/src/types'
import DocumentUploader from '@/src/components/DocumentUploader'
import ChatInterface from '@/src/components/ChatInterface'
import LogOut from './LogOut'

export default function MainPage() {

  // uploadedDoc is shared between both components
  // Uploader sets it → ChatInterface uses it to filter searches
  const [uploadedDoc, setUploadedDoc] = useState<UploadResponse | null>(null)


  const deleteDocument = async(documentId : string)=>{
    try {
      const data = await fetch(`/api/deleteDoc/${documentId}`, {method : 'DELETE'})

      
    } catch (error) {
      
    }
  }


  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* ── Header ── */}
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto flex items-center gap-3">

          <div className='flex justify-between items-center w-full'>
            <div className='flex justify-center items-center gap-3 flex-col'>
              <h1 className="font-semibold text-white">🧠DocuMind</h1>
              <p className="text-xs text-gray-500">
                RAG powered document intelligence
              </p>
            </div>

            <LogOut />
          </div>

         
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-4xl mx-auto h-[calc(100vh-65px)] 
                      flex flex-col p-6 gap-6">

        {/* Upload section — always visible at top */}
        {!uploadedDoc && (
          <div>
            <h2 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
              Upload Document
            </h2>
            <DocumentUploader onUploadComplete={setUploadedDoc} />
          </div>
        )}

        {/* Uploaded doc summary + reset button */}
        {uploadedDoc && (
          <div className="flex items-center justify-between 
                          bg-gray-900 border border-gray-800 
                          rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">📄</span>
              <div>
                <p className="text-sm font-medium text-gray-200">
                  {uploadedDoc.documentName}
                </p>
                <p className="text-xs text-gray-500">
                  {uploadedDoc.chunkCount} chunks stored in Qdrant
                </p>
              </div>
            </div>
            <button
              onClick={() => {deleteDocument(uploadedDoc?.documentId), setUploadedDoc(null) }}
              className="text-xs text-gray-500 hover:text-gray-300 
                         underline transition-colors"
            >
              Change document
            </button>
          </div>
        )}

        {/* Chat section — takes remaining height */}
        <div className="flex-1 bg-gray-900 border border-gray-800 
                        rounded-2xl overflow-hidden">
          <ChatInterface uploadedDoc={uploadedDoc} />
        </div>

      </div>
    </main>
  )
}