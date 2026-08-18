import { Worker } from 'bullmq'
import { redis } from '../src/lib/queue/redis'

import { createAdminClient } from '../src/lib/supabase/admin'
import { chunkPDF } from '../src/lib/chunker'
import { embedChunks } from '../src/lib/embeddings'
import { storeVectors, setupCollection } from '../src/lib/qdrant'


console.log('🚀 DocuMind worker started')


const worker = new Worker(
    'document-processing',

    async job => {
        console.log('📨 Job received!')
        console.log('Job ID:', job.id)
        console.log('Job data:', job.data)


        const {
            documentId,
            userId,
            storagePath,
            fileName,
        } = job.data

        console.log(`📄 Processing ${fileName}`)
        console.log(`Document ID: ${documentId}`)
        console.log(`Storage path: ${storagePath}`)
        console.log(`👤 User ID: ${userId}`)

        await setupCollection()

        // ── STEP 1: Download the pdf(or the file) from Supabase ────────────
        const supabase = createAdminClient()

        try {
            const { error: statusError } = await supabase
                .from('documents')
                .update({
                    status: 'PROCESSING',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', documentId)

            if (statusError) {
                throw new Error(
                    `Failed to update document status: ${statusError.message}`
                )
            }

            // throw new Error('TEST: Simulated processing failure')


            const { data, error: downloadError } = await supabase.storage.from('DocBucket').download(storagePath)

            if (downloadError || !data) {
                throw new Error(
                    `Failed to download ${fileName}: ${downloadError?.message}`
                )
            }

            console.log('Document Received')


            // STEP 2: Convert Blob → Buffer

            const arrayBuffer = await data.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            console.log(
                `📦 Buffer created: ${buffer.length} bytes`
            )

            // STEP 3: Chunk PDF

            const chunks = await chunkPDF(
                buffer,
                documentId,
                userId,
                fileName
            )

            console.log(
                `✂️ Created ${chunks.length} chunks`
            )

            // STEP 4: Generate embeddings

            const vectorPoints = await embedChunks(chunks)

            console.log(
                `🔢 Created ${vectorPoints.length} vector points`
            )


            // STEP 5: Store vectors in Qdrant

            await storeVectors(vectorPoints)

            console.log(
                `💾 Stored ${vectorPoints.length} vectors in Qdrant`
            )

            console.log(
                `🎉 Document ${documentId} processed successfully`
            )

            const { error } = await supabase
                .from('documents')
                .update({
                    status: 'COMPLETED',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', documentId)

            if (error) {
                throw new Error(
                    `Failed to update document status: ${error.message}`
                )
            }

        } catch (error) {

            await supabase
                .from('documents')
                .update({
                    status: 'FAILED',
                    error_message:
                        error instanceof Error
                            ? error.message
                            : 'Unknown processing error',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', documentId)

            throw error
        }
    },

    {
        connection: redis,
    }
)


worker.on('completed', job => {
    console.log(`✅ Job ${job.id} completed`)
})

worker.on('failed', (job, error) => {
    console.error(
        `❌ Job ${job?.id} failed:`,
        error.message
    )
})