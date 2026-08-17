

'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'

import { UploadResponse } from '../types'

// ─── Props ────────────────────────────────────────────────────
interface DocumentUploaderProps {
  onUploadComplete: (response: UploadResponse) => void
  // callback — when upload finishes, tell the parent component
  // parent will store the documentId and use it in chat queries
}

// ─── Upload Status Type ───────────────────────────────────────
type UploadStatus = 'idle' | 'uploading' | 'queued' | 'error'

export default function DocumentUploader({ onUploadComplete }: DocumentUploaderProps) {

  // ─── State ──────────────────────────────────────────────────
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [isDragOver, setIsDragOver] = useState(false)  // user dragging file over component
  const [errorMessage, setErrorMessage] = useState('')
  const [uploadedDoc, setUploadedDoc] = useState<UploadResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)  // hidden file input

  // ─── Core Upload Function ────────────────────────────────────
  // Called with the actual File object whether from drag+drop or click
  async function uploadFile(file: File) {

    // Validate file type before even sending
    if (!file.name.endsWith('.pdf')) {
      setStatus('error')
      setErrorMessage('Only PDF files are supported')
      return
    }

    // Validate size — 10MB max
    if (file.size > 10 * 1024 * 1024) {
      setStatus('error')
      setErrorMessage('File too large. Maximum size is 10MB')
      return
    }

    try {
      setStatus('uploading')
      setErrorMessage('')

      // Build FormData — this is how browsers send files over HTTP
      // FormData wraps the file in multipart/form-data format
      // Our API route reads it with: formData.get('file')
      const formData = new FormData()
      formData.append('file', file)  // 'file' must match what API route expects
      console.log(formData)

      // Call our upload API route
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
        // Don't set Content-Type header manually
        // Browser sets it automatically with the correct boundary for FormData
      })

      const data: UploadResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      // Success — store result and notify parent
      setUploadedDoc(data)
      onUploadComplete(data)  // tell parent: "here's the documentId"

      if (data?.status === 'QUEUED') {
        setStatus('queued')
      }

    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  // ─── Drag & Drop Handlers ────────────────────────────────────
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()  // must prevent default to allow drop
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]  // get the dropped file
    if (file) uploadFile(file)
  }

  // ─── Click to Upload Handler ─────────────────────────────────
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    console.log(file)
    if (file) uploadFile(file)
  }

  // ─── Reset to upload another file ────────────────────────────
  function handleReset() {
    setStatus('idle')
    setUploadedDoc(null)
    setErrorMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="w-full">

      {/* ── IDLE STATE — Drop zone ── */}
      {status === 'idle' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragOver
              ? 'border-blue-500 bg-blue-500/10'    // highlight when dragging
              : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
            }
          `}
        >
          <div className="text-4xl mb-3">📄</div>
          <p className="text-gray-300 font-medium mb-1">
            Drop your PDF here
          </p>
          <p className="text-gray-500 text-sm">
            or click to browse — max 10MB
          </p>

          {/* Hidden file input — triggered by clicking the drop zone */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* ── UPLOADING / PROCESSING STATE ── */}
      {(status === 'uploading') && (
        <div className="border border-gray-700 rounded-xl p-8 text-center">
          {/* Spinning loader */}
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent 
                          rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300 font-medium mb-1">
            Uploading...
          </p>

          <p className="text-gray-500 text-sm">
            Sending your document to the server...
          </p>
        </div>
      )}

      {/* ── QUEUED STATE ── */}

      {status === 'queued' && uploadedDoc && (
        <div className="border border-yellow-800 bg-yellow-900/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⏳</span>

            <div className="flex-1">
              <p className="text-yellow-400 font-medium mb-1">
                Document queued
              </p>

              <p className="text-gray-400 text-sm mb-1">
                {uploadedDoc.documentName}
              </p>

              <p className="text-gray-500 text-xs">
                Your document has been uploaded and is waiting to be processed.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="text-xs text-gray-500 hover:text-gray-300
                   underline transition-colors"
            >
              Upload another
            </button>
          </div>
        </div>
      )}

      {/* ── ERROR STATE ── */}
      {status === 'error' && (
        <div className="border border-red-800 bg-red-900/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div className="flex-1">
              <p className="text-red-400 font-medium mb-1">Upload failed</p>
              <p className="text-gray-400 text-sm">{errorMessage}</p>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-gray-500 hover:text-gray-300 
                         underline transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )}

    </div>
  )
}