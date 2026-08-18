// src/lib/rag.ts
// The orchestrator — connects every lib file together.
// This is the complete RAG pipeline in two functions.
//
// ingestDocument() = upload pipeline
// queryDocuments()  = chat pipeline

import { chunkPDF } from './chunker'
import { embedChunks, embedText } from './embeddings'
import { setupCollection, storeVectors, searchVectors } from './qdrant'
import { buildRAGPrompt, streamResponse } from './claude'
import { SearchResult } from '../types'
import { v4 as uuidv4 } from 'uuid'

// // ─── PIPELINE 1: Ingest Document ──────────────────────────────
// // Called when user uploads a PDF.
// // Takes the raw file, runs it through the full ingestion pipeline,
// // and stores everything in Qdrant ready to be searched.
// //
// // Input:  PDF file buffer + filename
// // Output: documentId + how many chunks were created
// export async function ingestDocument(
//   fileBuffer: Buffer,
//   fileName: string
// ): Promise<{ documentId: string; chunkCount: number }> {

//   // Generate a unique ID for this document
//   // Every chunk from this PDF will carry this ID
//   // So we can later filter searches to just this document
//   const documentId = uuidv4()

//   console.log(`\n🚀 Starting ingestion pipeline for: ${fileName}`)
//   console.log(`   Document ID: ${documentId}`)

//   // ── STEP 1: Setup ──────────────────────────────────────────
//   // Make sure our Qdrant collection exists before we try to store anything
//   // Remember — this is like "CREATE TABLE IF NOT EXISTS"
//   // Safe to call every time, won't duplicate
//   console.log('\n📦 Step 1: Setting up Qdrant collection...')
//   await setupCollection()

//   // ── STEP 2: Chunk ──────────────────────────────────────────
//   // Split the PDF into overlapping chunks
//   // A 20 page PDF might become ~60 chunks
//   // Each chunk = one focused piece of text
//   console.log('\n✂️  Step 2: Chunking document...')
//   const chunks = await chunkPDF(fileBuffer, documentId, fileName)
//   console.log(`   Created ${chunks.length} chunks`)

//   // ── STEP 3: Embed ──────────────────────────────────────────
//   // Convert every chunk into a vector (array of numbers)
//   // This is the expensive step — one API call per batch of 128 chunks
//   // After this step each chunk has its "GPS coordinates" on the meaning map
//   console.log('\n🔢 Step 3: Embedding chunks...')
//   const vectorPoints = await embedChunks(chunks)
//   console.log(`   Created ${vectorPoints.length} vector points`)

//   // ── STEP 4: Store ──────────────────────────────────────────
//   // Save all vector points to Qdrant
//   // After this step the document is fully searchable
//   console.log('\n💾 Step 4: Storing vectors in Qdrant...')
//   await storeVectors(vectorPoints)

//   console.log(`\n✅ Ingestion complete!`)
//   console.log(`   Document: ${fileName}`)
//   console.log(`   ID: ${documentId}`)
//   console.log(`   Chunks stored: ${chunks.length}`)

//   return {
//     documentId,
//     chunkCount: chunks.length
//   }
// }

// ─── Query Documents ──────────────────────────────
// Called when user sends a chat message.
// Takes the question, finds relevant chunks, streams back the answer.
//
// Input:  user's question + optional documentId to search within
// Output: ReadableStream (words flowing to the frontend)
export async function queryDocuments(
  question: string,
  userId: string,
  documentId?: string   // if provided, search only this document
                        // if not provided, search ALL documents
): Promise<ReadableStream> {

  console.log(`\n🔍 Starting query pipeline...`)
  console.log(`   Question: "${question}"`)
  if (documentId) {
    console.log(`   Searching within document: ${documentId}`)
  } else {
    console.log(`   Searching across ALL documents`)
  }

  // ── STEP 1: Embed the Question ─────────────────────────────
  // Convert the user's question into a vector
  // SAME model as we used for chunks — same meaning map
  // This is embedText() not embedChunks() because it's a single string
  console.log('\n🔢 Step 1: Embedding question...')
  const questionVector = await embedText(question)
  console.log(`   Question → vector of ${questionVector.length} numbers`)

  // ── STEP 2: Search Qdrant ──────────────────────────────────
  // Find the top 5 chunks whose vectors are closest to the question vector
  // "Closest" = most similar meaning = most relevant to the question
  console.log('\n🔍 Step 2: Searching for relevant chunks...')
  const searchResults: SearchResult[] = await searchVectors(
    questionVector,
    userId,
    5,           // top 5 most relevant chunks
    documentId, // filter to specific doc if provided
  )

  console.log(`   Found ${searchResults.length} relevant chunks`)

  if (searchResults.length === 0) {
    throw new Error('No relevant documents found')
}

  // Log each result so you can see what's being sent to Claude
  searchResults.forEach((result, i) => {
    console.log(`   Result ${i + 1}: score=${result.score.toFixed(2)} | ${result.documentName} p.${result.pageNumber}`)
  })

  // ── STEP 3: Build Prompt ───────────────────────────────────
  // Inject the retrieved chunks into the prompt
  // This is where RAG earns its name — we AUGMENT the prompt
  // with RETRIEVED context before GENERATING the answer
  console.log('\n📝 Step 3: Building RAG prompt...')
  const prompt = buildRAGPrompt(question, searchResults)

  // ── STEP 4: Stream Answer ──────────────────────────────────
  // Send the prompt to Claude and stream the response back
  // Returns a ReadableStream the API route will pipe to the frontend
  console.log('\n💬 Step 4: Streaming response from Claude...')
  const stream = await streamResponse(prompt, searchResults)

  return stream
}