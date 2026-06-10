
// Receives the file → calls ingestDocument() → returns result
//

import { NextRequest, NextResponse } from 'next/server'
import { ingestDocument } from '@/src/lib/rag'

export async function POST(request: NextRequest) {
  try {
    // ── STEP 1: Get the file from the request ──────────────
    // Frontend sends the PDF as FormData (multipart/form-data)
    // This is the standard way browsers send files over HTTP
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    console.log(file)

    // Validate — did the frontend actually send a file?
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }   // 400 = Bad Request
      )
    }

    // Validate file type — only PDFs allowed
    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      )
    }

    // Validate file size — max 10MB
    // Large files = too many chunks = slow processing
    const MAX_SIZE = 10 * 1024 * 1024  // 10MB in bytes
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    console.log(`📁 Received file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`)

    // ── STEP 2: Convert File to Buffer ─────────────────────
    // Our chunkPDF() function expects a Buffer (raw bytes)
    // File.arrayBuffer() gives us the raw bytes
    // Buffer.from() converts it to the Node.js Buffer format
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // ── STEP 3: Run the ingestion pipeline ─────────────────
    // This single call does everything:
    // chunk → embed → store in Qdrant
    // All the heavy lifting is in rag.ts
    const result = await ingestDocument(buffer, file.name)

    // ── STEP 4: Return success response ────────────────────
    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      documentName: file.name,
      chunkCount: result.chunkCount,
      message: `Successfully processed ${result.chunkCount} chunks from ${file.name}`
    })

  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }   // 500 = Internal Server Error
    )
  }
}