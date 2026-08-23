import { createHash } from 'crypto'

export function createQueryCacheKey(
    userId: string,
    documentId: string | undefined,
    question: string
): string {

    const normalizedQuestion = question
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')

    const rawKey = [
        userId,
        documentId ?? 'all-documents',
        normalizedQuestion,
    ].join(':')

    const hash = createHash('sha256')
        .update(rawKey)
        .digest('hex')

    return `documind:chat:${hash}`
}