
// This file defines the "shape" of all data in our app.

// So it is a contract and every file agrees on what data looks like.

// ─── Document ───────────────────────────────────────────────
// Represents a PDF the user has uploaded
export interface Document {
  id: string
  name: string          // "my-contract.pdf"
  size: number          // file size in bytes
  uploadedAt: Date
  chunkCount: number    // how many chunks we split it into
  status: 'processing' | 'ready' | 'error'
}

// ─── Chunk ───────────────────────────────────────────────────
// One piece of a document after splitting
// A 10 page PDF might become 50 chunks
export interface Chunk {
  id: string
  documentId: string    // which document this came from
  documentName: string  // "my-contract.pdf"
  content: string       // the actual text of this chunk
  pageNumber: number    // which page it came from
  chunkIndex: number    // chunk #3 of 50
}

// ─── Vector Point ────────────────────────────────────────────
// What we actually store in Qdrant
// = the chunk's text converted to numbers + metadata
export interface VectorPoint {
  id: string
  vector: number[]      // the embedding [0.2, 0.8, 0.1, ...] 
  payload: {            // original data stored alongside the vector
    documentId: string
    documentName: string
    content: string     // original text (so we can return it)
    pageNumber: number
    chunkIndex: number
  }
}

// ─── Search Result ───────────────────────────────────────────
// What Qdrant returns when we search
export interface SearchResult {
  content: string       // the chunk text
  documentName: string  // which document it came from
  pageNumber: number    // which page
  score: number         // similarity score (0 to 1)
}

// ─── Chat Message ────────────────────────────────────────────
// One message in the chat UI
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SearchResult[]  // citations shown under assistant messages
  createdAt: Date
}

// ─── API Response shapes ─────────────────────────────────────
export interface UploadResponse {
  success: boolean
  documentId: string
  documentName: string
  chunkCount: number
  message: string
  status : string
  error : string
}

export interface ChatRequest {
  message: string
  documentId?: string   // optional — search specific doc or all docs
}