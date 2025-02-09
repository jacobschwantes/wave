"use client";

import { signInWithSpotify } from "@/app/actions/auth";

export function SignIn() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="space-y-4 flex flex-col mb-8">
        <h1 className="text-3xl font-semibold tracking-tight flex items-center justify-center gap-2">
          wave <WaveIcon />
        </h1>
      </div>

      <div className="flex flex-col gap-4">
        <form action={signInWithSpotify}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#1DB954] px-6 py-3 font-semibold text-white transition-all hover:bg-[#1ed760] focus:ring-2 focus:ring-[#1DB954] focus:ring-offset-2"
          >
            <SpotifyIcon />
            Login with Spotify
          </button>
        </form>
      </div>

	  
    </div>
  );
}

function SpotifyIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <path d="M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <path d="M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    </svg>
  );
}
