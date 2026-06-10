// src/components/SourceCitations.tsx
// Displays the source citations under each assistant message.
// Shows which document and page each answer came from.
// Receives SearchResult[] from ChatInterface after parsing the stream.

import { SearchResult } from "../types"

interface SourceCitationsProps {
  sources: SearchResult[]
}

export default function SourceCitations({ sources }: SourceCitationsProps) {
  // Don't render anything if no sources
  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-3 space-y-2">

      {/* Section label */}
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        Sources
      </p>

      {/* One card per source */}
      {sources.map((source, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-3 rounded-lg 
                     bg-gray-800 border border-gray-700"
        >
          {/* Source number badge */}
          <span className="flex-shrink-0 w-5 h-5 rounded-full 
                           bg-blue-600 text-white text-xs 
                           flex items-center justify-center font-medium">
            {index + 1}
          </span>

          <div className="flex-1 min-w-0">
            {/* Document name + page */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-blue-400 truncate">
                {source.documentName}
              </span>
              <span className="text-xs text-gray-500">
                Page {source.pageNumber}
              </span>
              {/* Similarity score — shows how relevant this chunk was */}
              <span className="ml-auto text-xs text-gray-500">
                {(source.score * 100).toFixed(0)}% match
              </span>
            </div>

            {/* Preview of the actual chunk text */}
            {/* We truncate to 150 chars — just enough context */}
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
              {source.content.substring(0, 150)}
              {source.content.length > 150 ? '...' : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}