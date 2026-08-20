
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

    const indexes = ['documentId', 'userId']

    for (const field of indexes) {
        try {
            await client.createPayloadIndex(COLLECTION_NAME, {
                field_name: field,
                field_schema: 'keyword',
            })

            console.log(`✅ Payload index created for ${field}`)

        } catch (error: any) {

            if (error?.data?.status?.error?.includes('already exists')) {
                console.log(`✅ Payload index already exists: ${field}`)
            } else {
                throw error
            }
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
    queryVector: number[],
    userId: string,
    topK: number = 5,
    documentId?: string,
): Promise<SearchResult[]> {

    try {

        const mustFilters = [
            {
                key: 'userId',
                match: { value: userId }
            }
        ]

        if (documentId) {
            mustFilters.push({
                key: 'documentId',
                match: { value: documentId }
            })
        }

        const searchOptions = {
            vector: queryVector,
            limit: topK,
            with_payload: true,
            score_threshold: 0.3,
            filter: {
                must: mustFilters
            }
        }

        console.log(`   Filtering to user: ${userId}`)

        if (documentId) {
            console.log(`   Filtering to document: ${documentId}`)
        }

        const results = await client.search(
            COLLECTION_NAME,
            searchOptions
        )

        console.log(`✅ Found ${results.length} relevant chunks`)

        return results.map(result => ({
            content: result.payload?.content as string,
            documentName: result.payload?.documentName as string,
            pageNumber: result.payload?.pageNumber as number,
            score: result.score,
        }))

    } catch (error) {
        console.error('Search failed:', error)
        throw error
    }
}
// ─── Delete Document Vectors ──────────────────────────────────
// When a user deletes a document, remove all its vectors from Qdrant.

export async function deleteDocumentVectors(documentId: string, userId: string): Promise<void> {
    try {
        await client.delete(COLLECTION_NAME, {
            filter: {
                must: [
                    {
                        key: 'userId',
                        match: { value: userId }
                    },
                    {
                        key: 'documentId',
                        match: { value: documentId }
                    }
                ]
            },
            wait : true,
        })
        console.log(
            `🗑️ Deleted Qdrant vectors for document ${documentId}`
        )
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