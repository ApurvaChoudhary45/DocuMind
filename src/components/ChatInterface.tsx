// src/components/ChatInterface.tsx
// The main chat UI.
// Handles sending messages, reading the stream word by word,
// and displaying answers with source citations.

'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage, SearchResult, UploadResponse } from '../types'
import SourceCitations from './SourceCitations'

// ─── Props ────────────────────────────────────────────────────
interface ChatInterfaceProps {
  uploadedDoc: UploadResponse | null
  // the document the user uploaded
  // null = no document yet = search across all docs
}

export default function ChatInterface({ uploadedDoc }: ChatInterfaceProps) {

  // ─── State ──────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Core Function: Send Message ─────────────────────────────
  // This is where everything comes together.
  // Sends the question, reads the stream, updates the UI.
  async function sendMessage() {

    // Don't send empty messages or send while already streaming
    if (!input.trim() || isStreaming) return

    const userQuestion = input.trim()
    setInput('')
    setIsStreaming(true)

    // Add user message to chat history immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userQuestion,
      createdAt: new Date()
    }

    // Add empty assistant message — we'll fill it word by word
    // This is why the answer appears to stream in real time
    // We create the message box first, then fill it as words arrive
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',       // starts empty — stream fills this in
      sources: [],       // starts empty — added at end of stream
      createdAt: new Date()
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])

    try {
      // ── STEP 1: Call the chat API ──────────────────────────
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userQuestion,
          documentId: uploadedDoc?.documentId  // filter to uploaded doc
        })
      })

      if (!response.ok) throw new Error('Chat request failed')
      if (!response.body) throw new Error('No response body')

      // ── STEP 2: Get the stream reader ─────────────────────
      // response.body is the ReadableStream from our backend
      // getReader() gives us a way to read it chunk by chunk
      const reader = response.body.getReader()

      // TextDecoder converts bytes → string
      // Remember: streams carry bytes, not strings
      const decoder = new TextDecoder()

      // This accumulates the full response text as it streams in
      let fullText = ''

      // ── STEP 3: Read the stream word by word ──────────────
      // This is the core streaming loop
      while (true) {
        const { done, value } = await reader.read()
        // done = true means controller.close() was called on backend
        // value = the next chunk of bytes from the stream

        if (done) break  // stream finished, exit loop

        // Convert bytes back to string
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk

        // Check if sources have arrived at the end of stream
        // Remember in claude.ts we appended: __SOURCES__{json}
        // We split on this marker to separate answer from sources
        if (fullText.includes('__SOURCES__')) {
          const [answerPart, sourcesPart] = fullText.split('__SOURCES__')

          // Parse the sources JSON
          let sources: SearchResult[] = []
          try {
            const parsed = JSON.parse(sourcesPart)
            sources = parsed.sources || []
          } catch {
            sources = []
          }

          // Update the assistant message with answer + sources
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: answerPart.trim(), sources }
              : msg
          ))
        } else {
          // Sources haven't arrived yet
          // Just update the content with what we have so far
          // This is what makes the text appear word by word
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content: fullText }
              : msg
          ))
        }
      }

    } catch (error) {
      // If anything fails, show error in the assistant message
      setMessages(prev => prev.map(msg =>
        msg.id === (Date.now() + 1).toString()
          ? { ...msg, content: 'Sorry, something went wrong. Please try again.' }
          : msg
      ))
    } finally {
      setIsStreaming(false)
    }
  }

  // ─── Handle Enter Key ────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* ── Message History ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center 
                          h-full text-center py-20">
            <div className="text-5xl mb-4">🧠</div>
            <h3 className="text-gray-300 font-medium text-lg mb-2">
              {uploadedDoc
                ? `Ask anything about ${uploadedDoc.documentName}`
                : 'Upload a document to get started'
              }
            </h3>
            <p className="text-gray-500 text-sm max-w-sm">
              {uploadedDoc
                ? `Your document was split into ${uploadedDoc.chunkCount} searchable chunks. Ask any question about its contents.`
                : 'Drop a PDF above, then ask questions about it.'
              }
            </p>
          </div>
        )}

        {/* Message list */}
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              max-w-[80%] rounded-2xl px-4 py-3
              ${message.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-800 text-gray-100 rounded-bl-sm'
              }
            `}>
              {/* Message content */}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
                {/* Blinking cursor while streaming this message */}
                {isStreaming &&
                 message.role === 'assistant' &&
                 message === messages[messages.length - 1] && (
                  <span className="inline-block w-1.5 h-4 bg-gray-400 
                                   ml-0.5 animate-pulse align-middle" />
                )}
              </p>

              {/* Source citations — shown under assistant messages */}
              {message.role === 'assistant' &&
               message.sources &&
               message.sources.length > 0 && (
                <SourceCitations sources={message.sources} />
              )}
            </div>
          </div>
        ))}

        {/* Invisible div at bottom — scroll target */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ── */}
      <div className="border-t border-gray-700 p-4">

        {/* Show which document is active */}
        {uploadedDoc && (
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-400">
              Searching in: {uploadedDoc.documentName}
              ({uploadedDoc.chunkCount} chunks)
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              uploadedDoc
                ? "Ask a question..."
                : "Upload a document first..."
            }
            disabled={!uploadedDoc || isStreaming}
            rows={1}
            className="flex-1 bg-gray-800 text-gray-100 rounded-xl px-4 py-3
                       border border-gray-700 focus:border-blue-500
                       focus:outline-none resize-none text-sm
                       placeholder-gray-500 disabled:opacity-50
                       disabled:cursor-not-allowed"
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || !uploadedDoc || isStreaming}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white rounded-xl transition-colors
                       font-medium text-sm"
          >
            {isStreaming ? '...' : 'Send'}
          </button>
        </div>

        <p className="text-xs text-gray-600 mt-2 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>

    </div>
  )
}