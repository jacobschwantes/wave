import SpotifyClient from "@/lib/spotify/SpotifyClient";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artistName = searchParams.get("name");

  if (!artistName) {
    return NextResponse.json({ error: "Artist name is required" }, { status: 400 });
  }

  try {
    const spotifyClient = await SpotifyClient.getInstance();
    const imageUrl = await spotifyClient.getArtistImage(artistName);
    
    if (!imageUrl) {
      console.log(`No image found for artist: ${artistName}`);
    }
    
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error(`Failed to fetch image for ${artistName}:`, error);
    return NextResponse.json({ error: "Failed to fetch artist image" }, { status: 500 });
  }
} 