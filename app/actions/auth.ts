"use server"

import { signIn, signOut } from "@/auth"

export async function signInWithSpotify() {
  await signIn("spotify", { redirectTo: "/home" })
}

export async function signOutUser() {
  await signOut()
} 