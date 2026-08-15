import { NextRequest, NextResponse } from 'next/server'
import { uploadDocument } from '@/src/lib/storage'
import { v4 as uuidv4 } from 'uuid'
import { documentQueue } from '@/src/lib/queue/documentQueue'
export async function POST(request: NextRequest) {
    try {
        // ── STEP 1: Get the file ──────────────────────────────
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // ── STEP 2: Validate file ────────────────────────────
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return NextResponse.json(
                { error: 'Only PDF files are supported' },
                { status: 400 }
            )
        }

        const MAX_SIZE = 10 * 1024 * 1024

        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10MB' },
                { status: 400 }
            )
        }

        console.log(
            `📁 Received file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`
        )

        // ── STEP 3: Create stable document ID ────────────────
        const documentId = uuidv4()

        // ── STEP 4: Convert File → Buffer ────────────────────
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // ── STEP 5: Persist the original PDF ─────────────────
        const storagePath = await uploadDocument(
            buffer,
            documentId,
            file.name
        )

        console.log(`✅ Document stored: ${storagePath}`)

        await documentQueue.add('process-document', {
            documentId,
            storagePath,
            fileName: file.name,
        })

        console.log(`📨 Processing job queued for ${documentId}`)

        // ── STEP 6: Return upload acknowledgement ────────────
        return NextResponse.json(
            {
                success: true,
                documentId,
                documentName: file.name,
                storagePath,
                status: 'QUEUED',
            },
            { status: 202 }
        )

    } catch (error) {
        console.error('Upload failed:', error)

        return NextResponse.json(
            { error: 'Failed to upload document' },
            { status: 500 }
        )
    }
}