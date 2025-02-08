import { neon } from '@neondatabase/serverless';
import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";
import { Pool } from "@neondatabase/serverless";
import PostgresAdapter from "@auth/pg-adapter";
import type { JWT } from "next-auth/jwt";

const spotifyScopes = [
    "user-read-email",
    "user-read-private",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-read",
    "user-top-read",
    "user-read-recently-played",
    "user-follow-read",
].join(" ");

type TokenType = JWT & {
    accessToken: string;
    accessTokenExpires: number;
    refreshToken: string;
    error?: string;
};

async function refreshAccessToken(token: TokenType): Promise<TokenType> {
    try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${Buffer.from(
                    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
                ).toString("base64")}`,
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
            }),
        });

        const refreshedTokens = await response.json();
        if (!response.ok) throw refreshedTokens;

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        };
    } catch (error) {
        console.error("Error refreshing access token:", error);
        return { ...token, error: "RefreshAccessTokenError" };
    }
}

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
