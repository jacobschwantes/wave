import { auth } from "@/auth";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { Session } from "next-auth";
import { DateTime } from "next-auth/providers/kakao";
import SpotifyClient, { ClientSong, SongAristsGenres } from "../spotify/SpotifyClient";
import fs from "fs";
import path from "path";
import csv from "fast-csv";
import { genre_coords } from "./output";

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
	x: number;
	y: number;
	radius: number;
	genres: Genre[];
	user_id: number;
};

interface Coordinate {
	x: number;
	y: number;
}

export type Ripple = {
	id: number;
	x: number;
	y: number;
	radius: number;
	songs: ClientSong[];
	clusters: Cluster[];
	artists: Artist[];
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

	public async updateUserRippleRecomputeAt() {
		if (this.#sql && this.#session?.user?.id) {
			await this.#sql`
			UPDATE users
			SET "recomputeRipplesAt" = ${Math.floor(Date.now() / 1000) + 259200}
			WHERE "id" = ${this.#session.user.id}
			`;
		}
	}

	public async fetchRecomputeRipplesTime() {
		if (this.#sql && this.#session?.user?.id) {
			const result = await this.#sql`
			SELECT "recomputeRipplesAt" as "recomputeRipplesAt" FROM users WHERE "id" = ${this.#session.user.id}
			`;
			if (result && result[0] !== null) {
				return result[0].recomputeRipplesAt;
			}
		}

		return 0;
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
		this.#genreCoordinates = genre_coords;
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

		return [...new Set(_genres)];
	}

	private threshold = 1500;
	private calculateCenter(coords: Coordinate[]) {
		let x = 0;
		let y = 0;
		coords.forEach((coord) => {
			x += coord.x;
			y += coord.y;
		});

		x /= coords.length;
		y /= coords.length;
		return { x, y };
	}

	private calculateRadius(coords: Coordinate[]) {
		let radius = 0;
		coords.forEach((coord) => {
			radius += this.distance(coord, this.calculateCenter(coords));
		});
		return radius / coords.length;
	}

	async createClusters(genres: Genre[]): Promise<Cluster[]> {
		let clustered: number[] = [];
		const clusters: Cluster[] = [];
		for (let i = 0; i < genres.length; i++) {
			if (clustered.includes(i)) continue;
			let createdCluster: Cluster | null = null;
			for (let j = i + 1; j < genres.length; j++) {
				if (createdCluster) {
					if (
						this.distance(
							genres[j] as Coordinate,
							createdCluster as Coordinate
						) +
							createdCluster.radius <
						this.threshold
					) {
						createdCluster.genres.push(genres[j]);
						clustered.push(j);
					}
				} else if (this.distance(genres[i], genres[j]) < this.threshold) {
					// this new cluster needs to be an object in the db
					clustered.push(j);
					createdCluster = {
						id: -1,
						x: -1,
						y: -1,
						radius: -1,
						genres: [genres[i], genres[j]],
						user_id: Number(this.#session!.user!.id),
					};
				}
			}
			if (!createdCluster) {
				// add the cluster to the user
				createdCluster = {
					id: -1,
					x: -1,
					y: -1,
					radius: -1,
					genres: [genres[i]],
					user_id: Number(this.#session!.user!.id),
				};
			}
			const { x, y } = this.calculateCenter(createdCluster.genres);
			const radius = this.calculateRadius(createdCluster.genres);
			createdCluster.x = x;
			createdCluster.y = y;
			createdCluster.radius = radius;
			clusters.push(createdCluster);
		}

		for (let i = 0; i < clusters.length; i++) {
			const cluster = clusters[i];
			if (this.#sql) {
				let response = await this.#sql`
                INSERT INTO clusters (user_id, x, y, radius)
                VALUES (${cluster.user_id}, ${cluster.x}, ${cluster.y}, ${cluster.radius})
                ON CONFLICT (user_id, x, y) 
                DO UPDATE SET 
                    updated_at = NOW()
                RETURNING id, user_id, x, y, radius;
                `;
				clusters[i].id = response[0].id;
			}
		}

		for (let i = 0; i < clusters.length; i++) {
			const cluster = clusters[i];
			for (let j = 0; j < cluster.genres.length; j++) {
				if (this.#sql) {
					let response = await this.#sql`
                    INSERT INTO cluster_genres (cluster_id, genre_name)
                    VALUES (${cluster.id}, ${cluster.genres[j].name})
                    ON CONFLICT (cluster_id, genre_name) 
                    DO UPDATE SET 
                        updated_at = NOW()
                    RETURNING cluster_id, genre_name;
                    `;
				}
			}
		}

		return clusters;
	}

	async createRipples(
		clusters: Cluster[],
		songs: SongAristsGenres[]
	): Promise<Ripple[]> {
		let rippled: number[] = [];
		const ripples: Ripple[] = [];
		for (let i = 0; i < clusters.length; i++) {
			if (!this.#sql) return [];
			const existingRipples = await this.#sql`
			SELECT ripple_id FROM ripple_clusters WHERE cluster_id = ${clusters[i].id}
			`;
			for (const ripple of existingRipples) {
				if (this.distance(clusters[i], ripple as Coordinate) < this.threshold) {
					ripple.clusters.push(clusters[i]);
					ripple.radius = this.calculateRadius(ripple.clusters);
					ripple.x = this.calculateCenter(ripple.clusters).x;
					let response = await this.#sql`
					UPDATE ripples
					SET 
						radius = ${ripple.radius},
						x = ${ripple.x},
						updated_at = NOW()
					WHERE id = ${ripple.id}
					RETURNING id, ripple_id, radius, x;
					`;


					response = await this.#sql`
                    INSERT INTO ripple_clusters (ripple_id, cluster_id)
                    VALUES (${ripple.id}, ${clusters[i].id})
                    RETURNING ripple_id, cluster_id;
                    `;

					rippled.push(i);
					// only add the cluster to one ripple
					break;
				}
			}
			if (rippled.includes(i)) continue;

			// if (rippled.includes(i)) continue;
			// let createdRipple: Ripple|null = null;
			// for (let j = i + 1; j < clusters.length; j++) {
			//     if (createdRipple) {
			//         if (this.distance(clusters[j] as Coordinate, createdRipple as Coordinate) + createdRipple.radius < this.threshold) {
			//             createdRipple.clusters.push(clusters[j])
			//             // rippled.push(j)
			//         }
			//     } else if (this.distance(clusters[i], clusters[j]) < this.threshold) {
			//         // this new cluster needs to be an object in the db
			//         // rippled.push(j)
			//         createdRipple = { id: -1, x: -1, y: -1, radius: -1, clusters: [clusters[i], clusters[j]], songs: [], artists: [] }
			//     }
			// }
			// if (!createdRipple) {
				// add the cluster to the user
			let createdRipple = {
				id: -1,
				x: -1,
				y: -1,
				radius: -1,
				clusters: [clusters[i]],
				songs: [],
				artists: [],
			};
			// }
			const { x, y } = this.calculateCenter(createdRipple.clusters);
			const radius = this.calculateRadius(createdRipple.clusters);
			createdRipple.x = x;
			createdRipple.y = y;
			createdRipple.radius = radius;
			ripples.push(createdRipple);
		}

		for (let i = 0; i < ripples.length; i++) {
			if (!this.#sql) return [];
			const ripple = ripples[i];
			const genres: string[] = [];

			for (const cluster of ripple.clusters) {
				if (!this.#sql) return [];
				const result = await this.#sql`
					SELECT genre_name as "genreName" FROM cluster_genres WHERE "cluster_id" = ${cluster.id}
				`;

				for (const record of result) {
					let genre = record.genreName;
					genres.push(genre);
				}
			}

			const _songs = [];
			const _artists = [];
			for (let z = 0; z < songs.length; z++) {
				for (let j = 0; j < songs[z].artists.length; j++) {
					const artist = songs[z].artists[j];
					for (let k = 0; k < artist.genres.length; k++) {
						const genre = artist.genres[k];
						if (genres.includes(genre.name)) {
							_songs.push(songs[z]);
							_artists.push(artist);
						}
					}
				}
			}

			let response = await this.#sql`
            INSERT INTO ripples (x, y, radius)
            VALUES (${ripple.x}, ${ripple.y}, ${ripple.radius})
            ON CONFLICT (radius, x, y) 
            DO UPDATE SET 
                updated_at = NOW()
            RETURNING id, x, y, radius;
            `;
			ripples[i].id = response[0].id;

			for (let j = 0; j < _songs.length; j++) {
				let response = await this.#sql`
                UPDATE songs 
                SET ripple_id = ${ripples[i].id},
                    updated_at = NOW()
                WHERE id = ${_songs[j].id}
                RETURNING id, ripple_id;
                `;
			}

			for (let j = 0; j < _artists.length; j++) {
				let response = await this.#sql`
                INSERT INTO ripple_artists (artist_id, ripple_id)
                VALUES (${_artists[j].id}, ${ripples[i].id})
                ON CONFLICT (artist_id, ripple_id) 
                DO UPDATE SET 
                    updated_at = NOW()
                RETURNING artist_id, ripple_id;
                `;
			}
		}

		for (let i = 0; i < ripples.length; i++) {
			const ripple = ripples[i];
			for (let j = 0; j < ripples[i].clusters.length; j++) {
				if (this.#sql) {
					let response = await this.#sql`
                    INSERT INTO ripple_clusters (ripple_id, cluster_id)
                    VALUES (${ripple.id}, ${ripple.clusters[j].id})
                    RETURNING ripple_id, cluster_id;
                    `;
				}
			}
		}

		for (let i = 0; i < ripples.length; i++) {
			if (this.#sql) {
				let response = await this.#sql`
				INSERT INTO ripple_users (ripple_id, user_id)
				VALUES (${ripples[i].id}, ${this.#session!.user!.id})
				ON CONFLICT (ripple_id, user_id) 
				DO UPDATE SET updated_at = NOW();
				`;

			}
		}

		return ripples;
	}

	private distance(coord1: Coordinate, coord2: Coordinate) {
		return Math.sqrt(
			Math.pow(coord2.x - coord1.x, 2) + Math.pow(coord2.y - coord1.y, 2)
		);
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

	public async fetchRipples(): Promise<number[]> {
		const ripples = [];
		if (this.#sql) {
			const result = await this.#sql`
				SELECT ripple_id as "rippleId" FROM ripple_users WHERE "user_id" = ${this.#session!.user!.id}
			`;

			for (const record of result) {
				let rippleId = Number(record.rippleId);
				ripples.push(rippleId);
			}
		};

		return ripples;
	}

	public async fetchSpotifyIdsOfRipple(rippleId: number) {
		const spotifyIds = [];
		if (this.#sql) {
			const result = await this.#sql`
				SELECT spotify_id as "spotifyId" FROM songs WHERE "ripple_id" = ${rippleId}
			`;

			for (const record of result) {
				let spotifyId = record.spotifyId;
				spotifyIds.push(spotifyId);
			}
		};

		return spotifyIds;
	}

	public async fetchSpotifySongIds(rippleIds: number[]): Promise<Map<Number, string[]>> {
		const rippleToIds = new Map<Number, string[]>();

		for (const rippleId of rippleIds) {
			const _spotifyIds = await this.fetchSpotifyIdsOfRipple(rippleId);
			rippleToIds.set(rippleId, _spotifyIds);
		}

		return rippleToIds;
	}
}

export default NeonClient;
