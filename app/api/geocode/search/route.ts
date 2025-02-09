import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json([])
  }

  try {
    // using nominatim api for geocoding
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
      {
        headers: {
          'User-Agent': 'YourApp/1.0' // required by nominatim
        }
      }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json([], { status: 500 })
  }
} 