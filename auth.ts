import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";
import { Pool } from "@neondatabase/serverless";
import PostgresAdapter from "@auth/pg-adapter";

export const { handlers, signIn, signOut, auth } = NextAuth(() => {
	const pool = new Pool({ connectionString: process.env.DATABASE_URL });
	return {
		secret: process.env.AUTH_SECRET,
		providers: [Spotify],
		adapter: PostgresAdapter(pool),
	};
});
