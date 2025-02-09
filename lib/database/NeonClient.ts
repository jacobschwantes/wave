import { auth } from "@/auth";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { Session } from "next-auth";
import { DateTime } from "next-auth/providers/kakao";
import SpotifyClient from "../spotify/SpotifyClient";
import * as csv from "@fast-csv/parse";
import fs from "fs"
import path, { parse } from "path";

export type SpotifyTokens = {
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
};

export type User = {
    id: number;
    name: string;
    email: string;
    image: string;
}

export type Genre = {
    id: number;
    name: string;
    x: number;
    y: number;
    created_at: DateTime;
    updated_at: DateTime;
}

export type Artist = {
    id: number;
    genres: Genre[];
    spotify_id: string;
    name: string;
    created_at: DateTime;
    updated_at: DateTime;
}

export type Song = {
    id: number;
    genres: Genre[];
    spotify_id: string;
    ripple_id: number;
    created_at: DateTime;
    updated_at: DateTime;
}

export type Cluster = {
    id: number;
    genres: Genre[];
    user: User;
    created_at: DateTime;
    updated_at: DateTime;
}

export type Ripple = {
    id: number;
    songs: Song[];
    artists: Artist[];
    created_at: DateTime;
    updated_at: DateTime;
}

export type GenreCoordinate = {
    genre: string;
    x: number;
    y: number;
}

class NeonClient {
	private static instance: NeonClient | null = null;
	#sql: NeonQueryFunction<false, false> | null = null;
    #spotifyClient: SpotifyClient|null = null;
    #session: Session|null = null;
    #genreCoordinates: GenreCoordinate[] = [];

	private constructor() {
		this.#sql = neon(process.env.DATABASE_URL as string);
	}

	public static async getInstance(): Promise<NeonClient> {
		if (!NeonClient.instance) {
			NeonClient.instance = new NeonClient();
		}

		await NeonClient.instance.initialize();
		return NeonClient.instance;
	}

	private async initialize(): Promise<void> {
		try {
			this.#session = await auth();
            this.#spotifyClient = await SpotifyClient.getInstance();
            this.loadGenreCsv();
		} catch (error) {
			throw new Error("Failed to initialize NeonClient");
		}
	}

	public async fetchSpotifyTokens(): Promise<SpotifyTokens | null> {
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

	public async updateSpotifyTokens(accessToken: string, refreshToken: string, expiresAt: number): Promise<void> {
		try {
			if (this.#sql && this.#session?.user?.id) {
				await this.#sql`
                UPDATE accounts 
                SET access_token = ${accessToken},
                    refresh_token = ${refreshToken},
                    expires_at = ${expiresAt}
                WHERE "userId" = ${this.#session.user.id}
                `;
			}
		} catch (error) {
			throw error;
		}
	}

    public async upsertSong(trackData: any): Promise<Song> {
        if (!this.#sql) {
            throw new Error("Database connection not available");
        }
    
        try {
            const result = await this.#sql`
                INSERT INTO songs (spotify_id)
                VALUES (${trackData.track.id})
                ON CONFLICT (spotify_id) 
                DO UPDATE SET 
                    updated_at = NOW()
                RETURNING id, spotify_id, created_at, updated_at;
            `;
    
            if (this.#spotifyClient) {
                this.#spotifyClient.appendDbIdToSongObj(result[0].id, trackData.track.id);
            }
            
            return result[0] as Song;
        } catch (error) {
            console.error(`Error upserting song ${trackData.name}:`, error);
            throw error;
        }
    }
    
    public async upsertSongs(tracks: any[]): Promise<Song[]> {
        const songs = [];
        for (const track of tracks) {
            try {
                const song = await this.upsertSong(track);
                songs.push(song);
            } catch (error) {
                console.error(`Error processing track ${track.name}:`, error);
            }
        }
        return songs as Song[];
    }

    public async upsertArtists(artistsToUpsert: Artist[]): Promise<Artist[]> {
        const artists: Artist[] = [];
        if (this.#sql) {
            for (const artist of artistsToUpsert) {
                try {
                    if (!this.#sql) return [];
                    const response = await this.#sql`
                        INSERT INTO artists (spotify_id, name)
                        VALUES (${artist.spotify_id}, ${artist.name})
                        ON CONFLICT (spotify_id) 
                        DO UPDATE SET 
                            name = EXCLUDED.name,
                            updated_at = NOW()
                        RETURNING id, spotify_id, name, created_at, updated_at;
                    `;
    
                    if (this.#spotifyClient) {
                        console.log("CLIENT IS REAL")
                        this.#spotifyClient.appendDbIdToArtistObj(response[0].id, artist.spotify_id);
                    }
                    
                    artists.push(response[0] as Artist);
                } catch (error) {
                    console.error(`Error upserting artist ${artist.name}:`, error);
                }
            }
        }
    
        return artists;
    }

    private loadGenreCsv() {
        const genre_coordinates: { genre: string, x: number, y: number }[] = [] 
        const filePath = path.join("/csv", "genre_attrs.csv");        
        fs.createReadStream(filePath)
            .pipe(csv.parse({ headers: true }))
            .on("data", (row) => {
                genre_coordinates.push(row);
            })
        this.#genreCoordinates = genre_coordinates;
        console.log(this.#genreCoordinates);
    }

    private getGenreCoordinate(genre: string) {
        return { x: 0, y: 0}
    }

    public async upsertGenres(genres: string[]): Promise<Genre[]> {
        const _genres: Genre[] = [];
        if (this.#sql) {
            for (const genre of genres) {
                try {
                    if (!this.#sql) return [];
                    const { x, y } = this.getGenreCoordinate(genre);
                    const response = await this.#sql`
                        INSERT INTO genres (name, x, y)
                        VALUES (${genre}, ${x}, ${y})
                        ON CONFLICT (spotify_id) 
                        DO UPDATE SET 
                            name = EXCLUDED.name,
                            updated_at = NOW()
                        RETURNING id, spotify_id, name, created_at, updated_at;
                    `;
    
                    if (this.#spotifyClient) {
                        // this.#spotifyClient.appendDbIdToArtistObj(response[0].id, artist.spotify_id);
                    }
                    
                    _genres.push(response[0] as Genre);
                } catch (error) {
                    console.error(`Error upserting artist ${genre}:`, error);
                }
            }
        }
    
        return _genres;
        
    }
    
}

export default NeonClient;
