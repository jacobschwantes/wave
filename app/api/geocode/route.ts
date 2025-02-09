export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  
  // using nominatim (free, but consider caching responses)
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'User-Agent': 'YourApp/1.0' } } // nominatim requires user-agent
  )
  const data = await res.json()
  
  return Response.json(data)
} 