
import { Chunk } from "../types";
import { extractText } from "unpdf";


const CHUNK_SIZE = 500;

const CHUNK_OVERLAP = 100;

export async function chunkPDF(
    fileBUffer: Buffer,
    documentId: string,
    documentName: string
): Promise<Chunk[]> {


    // STEP 1: Extract raw text from the PDF
    // unpdf reads the binary PDF and gives us plain text
    console.log(`Reading PDF : ${documentName}`)
    const { text } = await extractText(
        new Uint8Array(fileBUffer),  // unpdf expects Uint8Array not Buffer
        { mergePages: true }         // merge all pages into one string
    )

    // pdfData.text = the entire PDF as one giant string
    // pdfData.numpages = total page count

    // Step 2 - Splitting the text into individual words
    const words = text
        .replace(/\n+/g, ' ') // replace newlines with spaces
        .replace(/\s+/g, ' ')      // collapse multiple spaces into one
        .trim()                     // remove leading/trailing whitespace
        .split(' ')                 // split into array of words
        .filter(word => word.length > 0)



    console.log(`📝 Total words in document: ${words.length}`)

    // Step 3 - Creating overlapping Chunks

    const chunks: Chunk[] = []

    let chunkIndex = 0

    const step = CHUNK_SIZE - CHUNK_OVERLAP

    for (let i = 0; i < words.length; i += step) {
        const chunkWords = words.slice(i, i + CHUNK_SIZE)

        const content = chunkWords.join(' ')

        if (chunkWords.length < 50) continue

        const pageNumber = Math.floor((i / words.length) * 10) + 1


        const chunk: Chunk = {
            id: `${documentId}-chunk-${chunkIndex}`,   // unique ID
            documentId,                                  // which document
            documentName,                                // "my-contract.pdf"
            content,                                     // the actual text
            pageNumber,                                  // estimated page
            chunkIndex                                   // chunk #N
        }

        chunks.push(chunk)
        chunkIndex += 1


    }
    return chunks

}




// Was a demo to understand the working

// export function chunkText(
//     text: string,
//     documentId: string,
//     documentName: string
// ): Chunk[] {
//     let words = text.trim().split('').filter(f => f.length > 0)

//     let chunks: Chunk[] = []

//     let step = CHUNK_SIZE - CHUNK_OVERLAP

//     for (let i = 0; i < words.length; i += step) {
//         const chunkWords = words.slice(i, i + CHUNK_SIZE)

//         if (chunkWords.length < 20) continue

//         chunks.push({
//             id: `${documentId}-chunk-${chunks.length}`,
//             documentId,
//             documentName,
//             content: chunkWords.join(' '),
//             pageNumber: 1,
//             chunkIndex: chunks.length
//         })

//     }
//     return chunks
// }

// console.log(chunkText('mannuisaking', '12', '45'))