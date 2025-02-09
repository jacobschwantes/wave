import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import SpotifyClient from '@/lib/spotify/SpotifyClient'

export async function POST(req: Request) {
  try {
    console.log('Save track endpoint hit')
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', needsReauth: true }, { status: 401 })
    }

    const { trackId } = await req.json()
    console.log('Received trackId:', trackId)

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
    }

    const spotify = await SpotifyClient.getInstance()
    try {
      await spotify.saveTrackToLibrary(trackId)
      return NextResponse.json({ success: true })
    } catch (error: any) {
      if (error.message.includes('Insufficient client scope')) {
        return NextResponse.json({ 
          error: 'Need new permissions', 
          needsReauth: true 
        }, { status: 403 })
      }
      throw error
    }
  } catch (error: any) {
    console.error('Failed to save track:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to save track' 
    }, { status: 500 })
  }
} 