// src/app/api/documents/route.ts
// Returns info about the vector database collection.
// Used by the frontend to show stats.

import { NextResponse } from 'next/server'
import { getCollectionStats } from '@/src/lib/qdrant'

export async function GET() {
  try {
    const stats = await getCollectionStats()

    if (!stats) {
      return NextResponse.json({
        totalPoints: 0,
        message: 'Collection not initialized yet'
      })
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Failed to get stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collection stats' },
      { status: 500 }
    )
  }
}