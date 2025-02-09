'use server'

import { updateUserLocation, getUserLocation } from './users'

export async function updateProfileLocation(userId: string, lat: number, lng: number) {
  try {
    await updateUserLocation(userId, lat, lng)
  } catch (error) {
    console.error('Failed to update location:', error)
    // rethrow with generic msg for client
    throw new Error('Failed to update location')
  }
}

export async function getProfileLocation(userId: string) {
  try {
    const location = await getUserLocation(userId)
    if (!location) return null

    console.log('location', location)

    // get display name from geocoding api
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${location.latitude}&lon=${location.longitude}&format=json`
    )
    const data = await res.json()

    return {
      lat: location.latitude,
      lng: location.longitude,
      display_name: data.display_name
    }
  } catch (error) {
    console.error('Failed to get location:', error)
    return null
  }
} 