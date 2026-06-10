# DocuMind 🧠
### AI-Powered Document Intelligence Platform

DocuMind is a production-grade RAG (Retrieval Augmented Generation) application that lets you upload PDF documents and have intelligent conversations with them. Built from scratch without abstraction frameworks — every part of the pipeline is explicit and understandable.

---

## 🚀 Live Demo

[documind.vercel.app](https://docu-mind-tau-lemon.vercel.app/)

---

## 📸 Features

- **PDF Upload** — Drag and drop any PDF up to 10MB
- **Semantic Search** — Finds relevant content by meaning, not keywords
- **Streaming Answers** — Responses stream word by word like ChatGPT
- **Source Citations** — Every answer cites the exact document and page
- **Multi-tenant Auth** — Each user's documents are private via Supabase
- **Production Ready** — Deployed on Vercel with auto-scaling

---

## 🏗️ Architecture

```
INGESTION PIPELINE (runs on upload)
────────────────────────────────────────────────────
PDF Upload → Text Extraction (unpdf)
           → Chunking with overlap (500 words, 100 overlap)
           → Embedding (VoyageAI voyage-3-lite → 512 dimensions)
           → Vector Storage (Qdrant Cloud with HNSW index)

QUERY PIPELINE (runs on every chat message)
────────────────────────────────────────────────────
User Question → Embedding (same VoyageAI model)
              → Cosine Similarity Search (Qdrant top-5)
              → Context Injection into Prompt
              → Streaming Generation (Claude Haiku 4.5)
              → Source Citations returned to UI
```

---

## 🧠 Key Concepts Implemented

### RAG (Retrieval Augmented Generation)
Instead of relying on the LLM's training data, we retrieve relevant chunks from the uploaded document and inject them into the prompt. Claude only answers from the provided context, making responses accurate and traceable.

### Vector Embeddings
Text is converted into 512-dimensional vectors using VoyageAI's `voyage-3-lite` model. Similar meaning produces similar vectors — this is what enables semantic search ("young dog" finds chunks about "puppies").

### Chunking Strategy
Documents are split into 500-word chunks with 100-word overlap. The overlap ensures no sentence is cut in half at a boundary, preserving context across chunk edges.

### HNSW Index
Qdrant uses a Hierarchical Navigable Small Worlds graph to find nearest neighbors in vector space in sub-millisecond time — even across millions of stored vectors.

### Streaming Responses
Uses Node.js `ReadableStream` and `TextEncoder` to stream Claude's output token by token to the frontend, with source citations appended at the end of the stream.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 15 + TypeScript | App Router, RSC, streaming UI |
| Styling | Tailwind CSS | Utility-first styling |
| Auth | Supabase | User authentication + session management |
| LLM | Anthropic Claude Haiku 4.5 | Answer generation with streaming |
| Embeddings | VoyageAI voyage-3-lite | Text → vector conversion (512 dims) |
| Vector DB | Qdrant Cloud | HNSW indexed similarity search |
| PDF Parsing | unpdf | Text extraction from PDF buffers |
| Deployment | Vercel | Serverless, auto-scaling, CI/CD |

---

## 📁 Project Structure

```
documind/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing page
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Main app page
│   │   └── api/
│   │       ├── upload/route.ts       # PDF ingestion endpoint
│   │       ├── chat/route.ts         # RAG query + streaming endpoint
│   │       └── documents/route.ts   # Collection stats endpoint
│   ├── lib/
│   │   ├── chunker.ts                # Text chunking with overlap
│   │   ├── embeddings.ts             # VoyageAI embedding calls
│   │   ├── qdrant.ts                 # Vector DB client + search
│   │   ├── rag.ts                    # Pipeline orchestration
│   │   └── claude.ts                 # Prompt builder + streaming
│   ├── components/
│   │   ├── ChatInterface.tsx         # Streaming chat UI
│   │   ├── DocumentUploader.tsx      # Drag & drop PDF uploader
│   │   └── SourceCitations.tsx       # Citation cards component
│   └── types/
│       └── index.ts                  # Shared TypeScript interfaces
├── .env.local                        # API keys (never committed)
└── next.config.ts                    # Next.js + Turbopack config
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js 18+
- Accounts on: [Anthropic Console](https://console.anthropic.com), [VoyageAI](https://voyageai.com), [Qdrant Cloud](https://cloud.qdrant.io), [Supabase](https://supabase.com)

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/documind.git
cd documind

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file in the root with the following:

```env
# Anthropic — LLM generation
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx

# VoyageAI — text embeddings
VOYAGE_API_KEY=pa-xxxxxxxxxxxx

# Qdrant Cloud — vector database
QDRANT_URL=https://xxxxxxxxxxxx.aws.cloud.qdrant.io
QDRANT_API_KEY=xxxxxxxxxxxx

# Supabase — authentication
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxx
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add all environment variables in Vercel dashboard
4. Deploy — Vercel auto-detects Next.js, zero config needed

Auto-SSL, global CDN, and CI/CD on every push are included out of the box.

---

## 💡 How The RAG Pipeline Works

```
1. User uploads contract.pdf (50 pages)

2. CHUNKING
   50 pages → ~150 chunks of 500 words each
   Each chunk overlaps 100 words with the next
   Overlap prevents context loss at boundaries

3. EMBEDDING
   Each chunk → VoyageAI API → [0.2, 0.8, 0.1, ...] (512 numbers)
   Similar meaning = similar numbers (cosine similarity)

4. STORAGE
   512 numbers + original text stored as a "point" in Qdrant
   Qdrant builds HNSW index for fast nearest-neighbor search

5. USER ASKS: "What is the payment deadline?"
   Question → VoyageAI → [0.2, 0.7, 0.1, ...] (512 numbers)

6. SEARCH
   Qdrant finds top-5 chunks with closest vectors
   Returns original text + similarity scores

7. GENERATION
   Retrieved chunks injected into Claude's prompt
   Claude reads context and answers: "The payment deadline is March 1st"
   Answer streams word by word to the browser

8. CITATIONS
   Source document + page number shown under every answer
```

---

## 🔒 Security

- API keys stored as environment variables, never in code
- Supabase RLS (Row Level Security) ensures users only access their own data
- File validation on upload (PDF only, 10MB max)
- Score threshold (0.3) filters irrelevant search results

---

## 📈 Scalability

- **Qdrant Cloud** handles millions of vectors with sub-millisecond search
- **Vercel serverless** auto-scales with traffic, no server management
- **Stateless API routes** — every request is independent, horizontally scalable
- **Batch embedding** — chunks processed in batches of 128 to maximise throughput
- **Exponential backoff** — automatic retry on rate limits with doubling delay

---

## 🧪 API Endpoints

### `POST /api/upload`
Ingests a PDF document through the full RAG pipeline.

**Request:** `multipart/form-data` with `file` field (PDF, max 10MB)

**Response:**
```json
{
  "success": true,
  "documentId": "uuid",
  "documentName": "contract.pdf",
  "chunkCount": 147,
  "message": "Successfully processed 147 chunks"
}
```

### `POST /api/chat`
Queries documents using RAG and streams the response.

**Request:**
```json
{
  "message": "What is the payment deadline?",
  "documentId": "uuid"
}
```

**Response:** `text/plain` stream — words arrive as they are generated, with `__SOURCES__{json}` appended at the end.

### `GET /api/documents`
Returns collection stats from Qdrant.

**Response:**
```json
{
  "totalPoints": 847,
  "vectorSize": 512,
  "collectionName": "documind"
}
```

---

## 🤝 Contributing

Pull requests are welcome. For major changes please open an issue first.

---

## 📄 License

MIT

---

## 👤 Author

Built by [Your Name](https://github.com/YOUR_USERNAME)

> *"Built from scratch without LangChain or LlamaIndex — every part of the RAG pipeline is explicit, understandable, and production-grade."*