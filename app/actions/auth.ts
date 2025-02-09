"use server"

import { signIn, signOut } from "@/auth"
import SpotifyClient from "@/lib/spotify/SpotifyClient"

export async function signInWithSpotify() {
    await signIn("spotify", { redirectTo: "/home" })
}

export async function signOutUser() {
  await signOut()
} 