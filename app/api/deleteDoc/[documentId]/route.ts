import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { deleteDocumentVectors } from '@/src/lib/qdrant'

interface RouteContext {
    params: Promise<{
        documentId: string
    }>
}

export async function DELETE(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        // ─────────────────────────────────────────────
        // STEP 1: Authenticate user
        // ─────────────────────────────────────────────

        const supabase = await createClient()

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { documentId } = await params

        if (!documentId) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 }
            )
        }

        console.log(`🗑️ Delete request for document: ${documentId}`)
        console.log(`👤 Requested by user: ${user.id}`)


        // ─────────────────────────────────────────────
        // STEP 2: Find document + verify ownership
        // ─────────────────────────────────────────────

        const { data: document, error: documentError } = await supabase
            .from('documents')
            .select('id, user_id, storage_path, file_name')
            .eq('id', documentId)
            .eq('user_id', user.id)
            .single()

        if (documentError || !document) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            )
        }

        console.log(`✅ Ownership verified for ${document.file_name}`)


        // ─────────────────────────────────────────────
        // STEP 3: Delete vectors from Qdrant
        // ─────────────────────────────────────────────

        await deleteDocumentVectors(
            document.id,
            user.id
        )

        console.log('✅ Qdrant vectors deleted')


        // ─────────────────────────────────────────────
        // STEP 4: Delete original PDF from Storage
        // ─────────────────────────────────────────────

        const adminSupabase = createAdminClient()

        const { error: storageError } = await adminSupabase
            .storage
            .from('DocBucket')
            .remove([document.storage_path])

        if (storageError) {
            throw new Error(
                `Failed to delete document from storage: ${storageError.message}`
            )
        }

        console.log('✅ PDF deleted from Storage')


        // ─────────────────────────────────────────────
        // STEP 5: Delete metadata from database
        // ─────────────────────────────────────────────

        const { error: deleteError } = await supabase
            .from('documents')
            .delete()
            .eq('id', documentId)
            .eq('user_id', user.id)

        if (deleteError) {
            throw new Error(
                `Failed to delete document metadata: ${deleteError.message}`
            )
        }

        console.log('✅ Document metadata deleted')


        // ─────────────────────────────────────────────
        // STEP 6: Success
        // ─────────────────────────────────────────────

        return NextResponse.json({
            success: true,
            documentId,
            message: 'Document deleted successfully'
        })

    } catch (error) {
        console.error('❌ Document deletion failed:', error)

        return NextResponse.json(
            {
                error: 'Failed to delete document'
            },
            { status: 500 }
        )
    }
}