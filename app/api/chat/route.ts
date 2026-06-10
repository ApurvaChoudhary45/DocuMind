// src/app/api/chat/route.ts
// Handles chat messages from the frontend.
// Receives question → calls queryDocuments() → streams answer back
//
// This route is different from upload — it doesn't return JSON.
// It returns a STREAM. The frontend reads it word by word.

import { NextRequest } from 'next/server'
import { queryDocuments } from '@/src/lib/rag'

export async function POST(request: NextRequest) {
  try {
    // ── STEP 1: Get the question from request body ──────────
    const body = await request.json()
    const { message, documentId } = body

    // Validate — did frontend send a message?
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'No message provided' }),
        { status: 400 }
      )
    }

    console.log(`💬 Received question: "${message}"`)

    // ── STEP 2: Run the query pipeline ─────────────────────
    // queryDocuments() returns a ReadableStream
    // It handles: embed question → search Qdrant → stream Claude response
    const stream = await queryDocuments(message, documentId)

    // ── STEP 3: Return the stream as the response ───────────
    // This is the key difference from a normal API route.
    // Instead of NextResponse.json() we return the raw stream.
    // The browser receives words one by one as Claude generates them.
    return new Response(stream, {
      headers: {
        // Tell the browser this is a stream not a regular response
        'Content-Type': 'text/plain; charset=utf-8',

        // Tell the browser not to buffer — show each word immediately
        'X-Content-Type-Options': 'nosniff',

        // Allow the frontend to read the stream cross-origin
        'Transfer-Encoding': 'chunked',
      }
    })

  } catch (error) {
    console.error('Chat failed:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process question' }),
      { status: 500 }
    )
  }
}