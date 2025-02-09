import { neon } from '@neondatabase/serverless'

export async function updateUserLocation(userId: string, lat: number, lng: number) {
    const sql = neon(process.env.DATABASE_URL as string)
    await sql`
    UPDATE users 
    SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
    WHERE id = ${userId}
  `
}

export async function getNearbyUsers(userId: string, radiusKm: number = 10) {
    const sql = neon(process.env.DATABASE_URL as string)
    const users = await sql`
    SELECT 
      id,
      // ... other user fields ...
      ST_X(location) as longitude,
      ST_Y(location) as latitude,
      ST_Distance(
        location::geography,
        (SELECT location FROM users WHERE id = ${userId})::geography
      )/1000 as distance_km
    FROM users
    WHERE id != ${userId}
    AND ST_DWithin(
      location::geography,
      (SELECT location FROM users WHERE id = ${userId})::geography,
      ${radiusKm * 1000}
    )
    ORDER BY distance_km
  `
    return users
}

export async function getUserLocation(userId: string) {
    const sql = neon(process.env.DATABASE_URL as string)
    const result = await sql`
    SELECT 
      ST_X(location::geometry) as longitude,
      ST_Y(location::geometry) as latitude,
      ST_AsText(location) as location_text
    FROM users 
    WHERE id = ${userId}
    AND location IS NOT NULL
  `
    return result[0]
} 