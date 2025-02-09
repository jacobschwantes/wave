import { auth } from "@/auth";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { Session } from "next-auth";
import { DateTime } from "next-auth/providers/kakao";
import SpotifyClient, { SongAristsGenres } from "../spotify/SpotifyClient";
import fs from "fs";
import path from "path";
import csv from "fast-csv";

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
};

export type Genre = {
	id: number;
	name: string;
	x: number;
	y: number;
	created_at: DateTime;
	updated_at: DateTime;
};

export type Artist = {
	id: number;
	genres: Genre[];
	spotify_id: string;
	name: string;
	created_at: DateTime;
	updated_at: DateTime;
};

export type Song = {
	id: number;
	genres: Genre[];
	spotify_id: string;
	ripple_id: number;
	created_at: DateTime;
	updated_at: DateTime;
};

export type Cluster = {
	id: number;
	genres: Genre[];
	user: User;
	created_at: DateTime;
	updated_at: DateTime;
};

export type Ripple = {
	id: number;
	songs: Song[];
	artists: Artist[];
	created_at: DateTime;
	updated_at: DateTime;
};

export type GenreCoordinate = {
	genre: string;
	x: number;
	y: number;
};

class NeonClient {
	private static instance: NeonClient | null = null;
	#sql: NeonQueryFunction<false, false> | null = null;
	#spotifyClient: SpotifyClient | null = null;
	#session: Session | null = null;
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
		console.log("INITIALIZING CSV");
		try {
			this.#session = await auth();
			this.#spotifyClient = await SpotifyClient.getInstance();
			await this.loadGenreCsv();
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

	public async updateSpotifyTokens(
		accessToken: string,
		refreshToken: string,
		expiresAt: number
	): Promise<void> {
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
				this.#spotifyClient.appendDbIdToSongObj(
					result[0].id,
					trackData.track.id
				);
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
						console.log("CLIENT IS REAL");
						this.#spotifyClient.appendDbIdToArtistObj(
							response[0].id,
							artist.spotify_id
						);
					}

					artists.push(response[0] as Artist);
				} catch (error) {
					console.error(`Error upserting artist ${artist.name}:`, error);
				}
			}
		}

		return artists;
	}

	private async loadGenreCsv() {
		const genre_coordinates: GenreCoordinate[] = [];

		// Store CSV in a server-accessible directory (not public/)
		const filePath = path.join(
			process.cwd(),
			"lib",
			"database",
			"genre_attrs.csv"
		);

		return new Promise((resolve, reject) => {
			fs.createReadStream(filePath)
				.pipe(csv.parse({ headers: true }))
				.on("data", (row) => {
					console.log("row", row);
					genre_coordinates.push(row);
				})
				.on("end", () => {
					this.#genreCoordinates = genre_coordinates;
					resolve(this.#genreCoordinates);
				})
				.on("error", (error) => {
					reject(error);
				});
		});
	}

	private binarySearchGenre(target: string): GenreCoordinate | null {
		let left = 0;
		let right = this.#genreCoordinates.length - 1;

		while (left <= right) {
			const mid = Math.floor((left + right) / 2);
			const midGenre = this.#genreCoordinates[mid].genre;

			if (midGenre === target) {
				return this.#genreCoordinates[mid];
			} else if (midGenre < target) {
				left = mid + 1;
			} else {
				right = mid - 1;
			}
		}

		return null;
	}

	private getGenreCoordinate(genre: string): { x: number; y: number } | null {
		const res = this.binarySearchGenre(genre);
		if (res) {
			console.log("found", res.genre, "actual", genre);
			return { x: res.x, y: res.y };
		}
		return null;
	}

	public async upsertGenres(genres: string[]): Promise<Genre[]> {
		const _genres: Genre[] = [];
		if (this.#sql) {
			for (const genre of genres) {
				try {
					if (!this.#sql) return [];
					const coord = this.getGenreCoordinate(genre);
					if (!coord) continue;
					const { x, y } = coord;
					const response = await this.#sql`
                        INSERT INTO genres (name, x, y)
                        VALUES (${genre}, ${x}, ${y})
                        ON CONFLICT (name) 
                        DO UPDATE SET 
                            name = EXCLUDED.name,
                            updated_at = NOW()
                        RETURNING name, x, y, created_at, updated_at;
                    `;

					if (this.#spotifyClient) {
						this.#spotifyClient.appendDbIdToGenreObj(
							response[0].id,
							x,
							y,
							genre
						);
					}

					_genres.push(response[0] as Genre);
				} catch (error) {
					console.error(`Error upserting artist ${genre}:`, error);
				}
			}
		}

		return _genres;
	}
	// {
	//     "id": 1034,
	//     "spotify_id": "3BWEa8rtenICK4a6X4OG3l",
	//     "artists": [
	//       {
	//         "id": 665,
	//         "spotify_id": "5NtMqQLCzdVvL7F8vFp3zM",
	//         "genres": [
	//           {
	//             "name": "shoegaze",
	//             "x": "230",
	//             "y": "12698"
	//           },
	//           {
	//             "name": "dream pop",
	//             "x": "365",
	//             "y": "10932"
	//           },
	//           {
	//             "name": "idm",
	//             "id": -1,
	//             "x": -1,
	//             "y": -1
	//           }
	//         ]
	//       }
	//     ]
	//   }
	public async generateRelationships(
		songArtistsGenres: SongAristsGenres[]
	): Promise<void> {
		songArtistsGenres.forEach((song) => {
			// CREATING SONG GENRES
			song.artists.forEach((artist) => {
				artist.genres.forEach(async (genre) => {
					if (this.#sql && genre.x !== -1 && genre.y !== -1) {
						let response = await this.#sql`
                        INSERT INTO song_genres (song_id, genre_name)
                        VALUES (${song.id}, ${genre.name})
                        ON CONFLICT (song_id, genre_name) 
                        DO UPDATE SET 
                            updated_at = NOW()
                        RETURNING song_id, genre_name, created_at, updated_at;
                        `;

						response = await this.#sql`
                        INSERT INTO artist_genres (artist_id, genre_name)
                        VALUES (${artist.id}, ${genre.name})
                        ON CONFLICT (artist_id, genre_name) 
                        DO UPDATE SET 
                            updated_at = NOW()
                        RETURNING artist_id, genre_name, created_at, updated_at;
                        `;
					}
				});
			});
		});
	}
}

export default NeonClient;
