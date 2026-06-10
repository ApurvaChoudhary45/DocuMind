
// Two jobs:
// 1. Build the RAG prompt (inject retrieved context into the question)
// 2. Stream Claude's response back to the frontend

import Anthropic from "@anthropic-ai/sdk";

import { SearchResult } from "../types";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || 'mock-key'
})

const MODEL = 'claude-haiku-4-5-20251001'


export function buildRAGPrompt(
    question: string,
    searchResults: SearchResult[]
): string {

    if (searchResults.length === 0) {
        return `The user asked: "${question}"

    No relevant context was found in the uploaded documents. 
    Tell the user you could not find relevant information to answer their question,
    and suggest they try rephrasing or uploading a more relevant document.`
    }

    const contextBlocks = searchResults
        .map((result, index) => `
Source ${index + 1}:
Document: ${result.documentName}
Page: ${result.pageNumber}
Relevance Score: ${(result.score * 100).toFixed(0)}%
Content: ${result.content}
`.trim())
        .join('\n\n---\n\n')

    return `You are DocuMind, an AI assistant that answers questions about uploaded documents.

    CONTEXT FROM DOCUMENTS:
    ${contextBlocks}

INSTRUCTIONS:
- Answer the user's question using ONLY the context provided above
- If the answer is in the context, answer confidently and cite which Source you used
- If the context doesn't contain enough information, say so honestly
- Keep answers clear and concise
- Always mention which document and page the information came from

USER QUESTION: ${question}`
}



export async function streamResponse(
    prompt: string,
    searchResults: SearchResult[]): Promise<ReadableStream> {

    const stream = new ReadableStream({
        async start(controller) {

            // Opening the tap for data flow
            try {
                const claudeStream = await anthropic.messages.stream({
                    model: MODEL,
                    max_tokens: 1024,
                    messages: [{ role: 'user', content: prompt }]
                })

                // Words coming through Pipe

                claudeStream.on('text', (text) => { // The second a new word generates this function will run. .on('text') will make the fn() run again as soon as a new word generates.
                    const encoded = new TextEncoder().encode(text) // As readableStream is a low level api it carries raw bytes which here we are converting text into bytes using textendcoder
                    controller.enqueue(encoded)
                })

                claudeStream.on('finalMessage', () => {
                    // Send sources as a special JSON chunk at the end
                    // The frontend will parse this to show citation cards
                    const sourcesPayload = JSON.stringify({
                        type: 'sources',
                        sources: searchResults
                    })
                    const encoded = new TextEncoder().encode(
                        `\n\n__SOURCES__${sourcesPayload}`
                    )
                    controller.enqueue(encoded)
                    controller.close()    // close the pipe — stream complete
                })

                claudeStream.on('error', (error) => {
                    controller.error(error)
                })

            } catch (error) {
                controller.error(error)
            }
        }
    })
    return stream
}
