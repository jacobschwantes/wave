import { auth } from "@/auth";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { Session } from "next-auth";

type SpotifyTokens = {
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
};

class SpotifyClient {
	private static instance: SpotifyClient | null = null;
	#sql: NeonQueryFunction<false, false> | null = null;
	#session: Session | null = null;
	#accessToken: string = "";
	#refreshToken: string = "";
	#expiresAt: number = 0;
	#SPOTIFY_BASE_URL: string = "https://api.spotify.com/v1/";

	private constructor() {
		this.#sql = neon(process.env.DATABASE_URL as string);
	}

	public static async getInstance(): Promise<SpotifyClient> {
		if (!SpotifyClient.instance) {
			SpotifyClient.instance = new SpotifyClient();
		}
		await SpotifyClient.instance.initialize();
		return SpotifyClient.instance;
	}

	private async initialize(): Promise<void> {
		try {
			this.#session = await auth();
			const tokens = await this.#fetchSpotifyTokens();

			if (tokens) {
				const { accessToken, refreshToken, expiresAt } = tokens;
				this.#accessToken = accessToken;
				this.#refreshToken = refreshToken;
				this.#expiresAt = expiresAt;
			}
		} catch (error) {
			throw new Error("Failed to initialize SpotifyClient");
		}
	}

	async #fetchSpotifyTokens(): Promise<SpotifyTokens | null> {
		if (!this.#sql || !this.#session) return null;

		const userId = this.#session.user?.id;
		if (!userId) return null;

		try {
			const result = await this.#sql(
				`SELECT access_token as "accessToken", refresh_token as "refreshToken", expires_at as "expiresAt" FROM accounts WHERE "userId" = ${userId}`
			);

			const spotifyTokens = {
				accessToken: result[0].accessToken,
				refreshToken: result[0].refreshToken,
				expiresAt: Number(result[0].expiresAt),
			};

			return result.length > 0 ? (spotifyTokens as SpotifyTokens) : null;
		} catch (error) {
			console.error("Error fetching Spotify tokens:", error);
			return null;
		}
	}

	async #refreshAccessToken(): Promise<void> {
		if (!this.#refreshToken) {
			console.log("No refresh token available");
			return;
		}

		try {
			const url = "https://accounts.spotify.com/api/token";

			const payload = {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					grant_type: "refresh_token",
					refresh_token: this.#refreshToken,
					client_id: process.env.AUTH_SPOTIFY_ID as string,
				}),
			};

			const body = await fetch(url, payload);
			const response = await body.json();

			if (!response.ok) {
				console.log("Spotify Request Failed");
				return;
			}

			const refreshedTokens = await response.json();

			this.#accessToken = refreshedTokens.access_token;
			this.#expiresAt = Number(
				(Date.now() / 1000).toFixed(0) + Number(refreshedTokens.expires_in)
			);
			if (refreshedTokens.refresh_token) {
				this.#refreshToken = refreshedTokens.refresh_token;
			}

			if (this.#sql && this.#session?.user?.id) {
				await this.#sql`
                UPDATE accounts 
                SET access_token = ${this.#accessToken},
                    refresh_token = ${this.#refreshToken},
                    expires_at = ${this.#expiresAt}
                WHERE "userId" = ${this.#session.user.id}
                `;
			}
		} catch (error) {
			throw error;
		}
	}

	public async getAccessToken(): Promise<string> {
		if (Date.now() / 1000 >= this.#expiresAt) {
			await this.#refreshAccessToken();
		}
		return this.#accessToken;
	}

	async #makeSpotifyAPIRequest(
		url: string,
		params: Record<string, string> = {}
	) {
		const queryString =
			Object.keys(params).length > 0 ? "?" + new URLSearchParams(params) : "";

		const response = await fetch(this.#SPOTIFY_BASE_URL + url + queryString, {
			headers: {
				Authorization: `Bearer ${await this.getAccessToken()}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Spotify API error: ${response.status}`);
		}

		return await response.json();
	}

	public async getRecentlyPlayedTracks(
		limit: number = 20,
		after: string = "",
		before: string = ""
	) {
		const params: Record<string, string> = { "limit": limit.toString() };
        if (after) {
            params["after"] = after;
        }
        if (before) {
            params["before"] = before;
        }

        const response = await this.#makeSpotifyAPIRequest("me/player/recently-played", params);
        return response;
	}
}

export default SpotifyClient;
