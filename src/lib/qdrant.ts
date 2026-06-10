
import { QdrantClient } from "@qdrant/js-client-rest";

import { VectorPoint, SearchResult } from "../types";

// This how we connect to Qadrant

const client = new QdrantClient({
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY,
})


const COLLECTION_NAME = 'documind'

const VECTOR_SIZE = 512

export async function setupCollection(): Promise<void> {
    try {
        const collection = await client.getCollections()

        const exists = collection.collections.some(
            col => col.name === COLLECTION_NAME
        )
        if (exists) {
            console.log(`✅ Collection "${COLLECTION_NAME}" already exists`)
            await createPayloadIndexes()
            return
        }

        await client.createCollection(COLLECTION_NAME, {
            vectors: {
                size: VECTOR_SIZE,  // Vector size that you have taken must match the embedding model output or else Qdrant will decline our vetors
                distance: "Cosine",
            }
        })

        console.log(`🎉 Created collection "${COLLECTION_NAME}"`)
        console.log(`   Vector size: ${VECTOR_SIZE}`)
        console.log(`   Distance metric: Cosine similarity`)

        await createPayloadIndexes()

    } catch (error) {
        console.error('Failed to setup Qdrant collection:', error)
        throw error
    }
}

// ─── Create Payload Indexes ───────────────────────────────────
// Qdrant needs explicit indexes on fields we filter by.
// Without this, filtering by documentId throws a 400 error.
// Same concept as CREATE INDEX in SQL.
async function createPayloadIndexes(): Promise<void> {
  try {
    // Index on documentId — used to filter search to one document
    await client.createPayloadIndex(COLLECTION_NAME, {
      field_name: 'documentId',
      field_schema: 'keyword',  // keyword = exact string match
    })
    console.log('✅ Payload index created for documentId')

  } catch (error: any) {
    // If index already exists Qdrant throws an error
    // We can safely ignore that specific error
    if (error?.data?.status?.error?.includes('already exists')) {
      console.log('✅ Payload indexes already exist')
    } else {
      console.error('Failed to create payload indexes:', error)
    }
  }
}

export async function storeVectors(points: VectorPoint[]): Promise<void> {

    try {
        console.log(`💾 Storing ${points.length} vectors in Qdrant...`)

        // Qdrant expects points in a specific format
        // We map our VectorPoint type to match exactly what Qdrant wants

        const qdrantPoints = points.map(point => ({

            id: point.id,
            vector: point.vector,
            payload: point.payload

        }))

        // upsert = insert or update (meaning if point is not there insert it else update the existing one)

        await client.upsert(COLLECTION_NAME, {
            wait: true,
            points: qdrantPoints
        })

        console.log(`✅ Successfully stored ${points.length} vectors`)

    } catch (error) {
        console.error('Failed to store vectors:', error)
        throw error
    }

}

// Step 3 Searching in the vector DB (heart of RAG)

export async function searchVectors(
    queryVector: number[],      // embedText(userQuestion) result
    topK: number = 5,           // how many results to return
    documentId?: string       // if docID available search within one document
): Promise<SearchResult[]> {
    try {

        const searchOptions: any = {
            vector: queryVector,
            limit: topK,
            with_payload: true, //
            score_threshold: 0.3 // So here the threshold is 0.3 anything below this would be  irrelevant 
        }

        if (documentId) {
            searchOptions.filter = {
                must: [{
                    key: 'documentId',        // filter by this payload field
                    match: { value: documentId }  // must equal this value
                }]
            }
        }
        console.log(`   Filtering to document: ${documentId}`)

        const results = await client.search(COLLECTION_NAME, searchOptions)

        console.log(`✅ Found ${results.length} relevant chunks`)

        // Now Transform Qdrant results into our SearchResult type

        return results.map(result => ({
            content: result.payload?.content as string,
            documentName: result.payload?.documentName as string,
            pageNumber: result.payload?.pageNumber as number,
            score: result.score, // Score similarity 
        }))


    } catch (error) {
        console.error('Search failed:', error)
        throw error
    }
}

// ─── Delete Document Vectors ──────────────────────────────────
// When a user deletes a document, remove all its vectors from Qdrant.

export async function deleteDocumentVectors(documentId: string): Promise<void> {
    try {
        await client.delete(COLLECTION_NAME, {
            filter: {
                must: [{
                    key: 'documentId',
                    match: { value: documentId }
                }]
            }
        })
    } catch (error) {
        console.error('Failed to delete vectors:', error)
        throw error
    }
}

// If you want to get the collection information 

export async function getCollectionStats() {
    try {
        const info = await client.getCollection(COLLECTION_NAME)

        return {
            totalPoints: info.points_count,    // total chunks stored
            vectorSize: VECTOR_SIZE,
            collectionName: COLLECTION_NAME,
        }
    } catch {
        return null
    }
}