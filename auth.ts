import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";
import { Pool } from "@neondatabase/serverless";
import PostgresAdapter from "@auth/pg-adapter";

const spotifyScopes = [
    "user-read-email",
    "user-read-private",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-read",
    "user-library-modify",
    "user-top-read",
    "user-read-recently-played",
    "user-follow-read",
].join(" ");

export const { handlers, signIn, signOut, auth } = NextAuth(() => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    return {
        secret: process.env.AUTH_SECRET,
        providers: [
            Spotify({
                clientId: process.env.AUTH_SPOTIFY_ID,
                clientSecret: process.env.AUTH_SPOTIFY_SECRET,
                authorization: `https://accounts.spotify.com/authorize?scope=${spotifyScopes}`,
            }),
        ],
        adapter: PostgresAdapter(pool),
    };
});
