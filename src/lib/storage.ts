import { createAdminClient } from "./supabase/admin"

const BUCKET_NAME = 'DocBucket'

export async function uploadDocument(
    buffer: Buffer,
    documentId: string,
    fileName: string
): Promise<string> {

    const supabase = createAdminClient()

    const storagePath = `${documentId}/${fileName}`

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, buffer, {
            contentType: 'application/pdf',
            upsert: false,
        })

    if (error) {
        throw new Error(`Failed to upload document: ${error.message}`)
    }

    return storagePath
}