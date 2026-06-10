
import { VoyageAIClient } from 'voyageai'

import { VectorPoint, Chunk } from '../types'

import { v4 as uuidv4 } from 'uuid'

const voyage = new VoyageAIClient({
    apiKey: process.env.VOYAGE_API_KEY || 'mock-key'
})

const EMBEDDING_MODEL = 'voyage-3-lite'


export async function embedText(text: string): Promise<number[]> {
    if (!process.env.VOYAGE_API_KEY || process.env.VOYAGE_API_KEY === 'mock-key') {
        console.log('⚠️  Using mock embedding (no VoyageAI key found)')

    }

    try {
        const response = await voyage.embed({
            input: text,   // Text need to be converted to vector form
            model: EMBEDDING_MODEL  // Model being used
        })

        if (!response.data || response.data.length === 0) { // Null checker
            throw new Error('No embedding returned from VoyageAI')
        }
        // response.data[0].embedding is the array of numbers

        const vector = response?.data[0]?.embedding as number[]

        console.log(vector)

        return vector

    } catch (error) {
        console.error("Embedding error:", error);
        throw new Error(`Failed to embed text: ${error}`)
    }

}

export async function embedChunks(chunks: Chunk[]): Promise<VectorPoint[]> {

    console.log(`🔄 Embedding ${chunks.length} chunks...`)

    const BATCH_SIZE = 128
    const vectorPoints: VectorPoint[] = []

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {

        const batch = chunks.slice(i, i + BATCH_SIZE)

        const texts = batch.map(chunk => chunk.content)

        let vectors: number[][]

        const response = await voyage.embed({
            input: texts,
            model: EMBEDDING_MODEL
        })

        if (!response.data || response.data.length === 0) {
            throw new Error('No embedding returned from VoyageAI')
        }

        vectors = response.data.map(i => i.embedding as number[])

        const batchPoints: VectorPoint[] = batch.map((chunk, index) => ({
            id: uuidv4(),              // unique ID for Qdrant
            vector: vectors[index],    // the 512 numbers
            payload: {
                // Everything in payload is stored ALONGSIDE the vector in Qdrant
                // When Qdrant finds this vector, it returns all this data too
                // This is how we get back the original text and know which doc it came from
                documentId: chunk.documentId,
                documentName: chunk.documentName,
                content: chunk.content,        // ← original text, returned with search results
                pageNumber: chunk.pageNumber,
                chunkIndex: chunk.chunkIndex,
            }
        }))

        vectorPoints.push(...batchPoints)


    }

    return vectorPoints

}
