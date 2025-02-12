import { auth } from "@/auth";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { Session } from "next-auth";
import SpotifyClient, {
	SongAristsGenres,
} from "../spotify/SpotifyClient";
import { genre_coords } from "./output";
import {
	SpotifyTokens, Genre, Artist, Song,
	Cluster, Ripple, GenreCoordinate, Comment,
	Coordinate
} from "./types";

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
			const response = await this.#sql`
			UPDATE users
			SET "recomputeRipplesAt" = ${Math.floor(Date.now() / 1000) + 259200}
			WHERE "id" = ${this.#session.user.id}
			`;
		}
	}

	public async fetchRecomputeRipplesTime() {
		if (this.#sql && this.#session?.user?.id) {
			const result = await this.#sql`
			SELECT "recomputeRipplesAt" as "recomputeRipplesAt" FROM users WHERE "id" = ${this.#session.user.id
				}
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

	private threshold = 500;
	private rippleThreshold = 1500;
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
		const center = this.calculateCenter(coords);
		let radius = 0;
		coords.forEach((coord) => {
			radius = Math.max(this.distance(coord, center), radius);
		});
		return radius + 25;
	}

	async createClusters(genres: Genre[]): Promise<Cluster[]> {
		const clustered = new Set<number>();
		const clusters: Cluster[] = [];

		for (let i = 0; i < genres.length; i++) {
			if (clustered.has(i)) continue;

			// init cluster with empty coords
			const runningCluster: Cluster = {
				id: -1,
				x: 0,  // will be calculated after all genres added
				y: 0,
				radius: 0,
				genres: [genres[i]],
				user_id: Number(this.#session!.user!.id),
			};
			clustered.add(i);

			// add nearby genres to cluster
			for (let j = i + 1; j < genres.length; j++) {
				if (
					this.distance(
						this.calculateCenter(runningCluster.genres),
						genres[j]
					) +
					this.calculateRadius(runningCluster.genres) <
					this.threshold
				) {
					runningCluster.genres.push(genres[j]);
					clustered.add(j);
				}
			}

			// calculate final position and radius
			const center = this.calculateCenter(runningCluster.genres);
			runningCluster.x = center.x;
			runningCluster.y = center.y;
			runningCluster.radius = this.calculateRadius(runningCluster.genres);
			clusters.push(runningCluster);
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

	// helper methods
	private async findNearbyRipples(cluster: Cluster): Promise<any[]> {
		if (!this.#sql) return [];
		// spatial query to find nearby ripples
		return await this.#sql`
		WITH nearby_ripples AS (
			SELECT DISTINCT r.id, r.x, r.y, r.radius
			FROM ripples r
			WHERE ST_DWithin(
				ST_MakePoint(r.x, r.y)::geography,
				ST_MakePoint(${cluster.x}, ${cluster.y})::geography,
				${this.rippleThreshold}
			)
		)
		SELECT 
			r.id as ripple_id,
			r.x as ripple_x,
			r.y as ripple_y,
			r.created_at,
			r.updated_at,
			JSON_AGG(
				JSON_BUILD_OBJECT(
					'id', c.id,
					'x', c.x,
					'y', c.y,
					'radius', c.radius,
					'user_id', c.user_id
				)
			) as clusters
		FROM nearby_ripples nr
		JOIN ripples r ON r.id = nr.id
		JOIN ripple_clusters rc ON r.id = rc.ripple_id
		JOIN clusters c ON rc.cluster_id = c.id
		GROUP BY r.id, r.x, r.y, r.created_at, r.updated_at;
		`;
	}

	private async getGenresForCluster(clusterId: number): Promise<string[]> {
		if (!this.#sql) return [];
		const result = await this.#sql`
			SELECT genre_name as "genreName" 
			FROM cluster_genres 
			WHERE "cluster_id" = ${clusterId}
		`;
		return result.map(r => r.genreName);
	}

	private async createRippleAssociations(ripple: Ripple, songs: SongAristsGenres[]) {
		console.time('createRippleAssociations');
		if (!this.#sql) return;

		console.time('getGenres');
		const genres: string[] = [];
		for (const cluster of ripple.clusters) {
			genres.push(...await this.getGenresForCluster(cluster.id));
		}
		console.timeEnd('getGenres');

		console.time('findMatches');
		const _songsMap = new Map<number, SongAristsGenres>();
		const _artists = [];
		for (const song of songs) {
			for (const artist of song.artists) {
				for (const genre of artist.genres) {
					if (genres.includes(genre.name)) {
						_songsMap.set(song.id, song);
						_artists.push(artist);
					}
				}
			}
		}
		console.timeEnd('findMatches');

		const _songs = Array.from(_songsMap.values());

		console.time('createAssociations');
		await this.createSongRippleAssociations(ripple.id, _songs);
		await this.createArtistRippleAssociations(ripple.id, _artists);
		console.timeEnd('createAssociations');

		console.timeEnd('createRippleAssociations');
	}

	private async createSongRippleAssociations(rippleId: number, songs: SongAristsGenres[]) {
		if (!this.#sql) return;
		for (const song of songs) {
			await this.#sql`
			INSERT INTO ripple_songs (song_id, ripple_id)
			VALUES (${song.id}, ${rippleId})
			ON CONFLICT (song_id, ripple_id)
			DO UPDATE SET updated_at = NOW()
			RETURNING song_id, ripple_id;
			`;
		}
	}

	private async createArtistRippleAssociations(rippleId: number, artists: any[]) {
		if (!this.#sql) return;
		for (const artist of artists) {
			await this.#sql`
			INSERT INTO ripple_artists (artist_id, ripple_id)
			VALUES (${artist.id}, ${rippleId})
			ON CONFLICT (artist_id, ripple_id)
			DO UPDATE SET updated_at = NOW()
			RETURNING artist_id, ripple_id;
			`;
		}
	}

	private async persistRipple(ripple: Ripple): Promise<number> {
		if (!this.#sql) throw new Error("No db connection");

		const response = await this.#sql`
		INSERT INTO ripples (x, y, radius)
		VALUES (${ripple.x}, ${ripple.y}, ${ripple.radius})
		ON CONFLICT (radius, x, y)
		DO UPDATE SET updated_at = NOW()
		RETURNING id, x, y, radius;
		`;
		return response[0].id;
	}

	private async createClusterRippleAssociations(ripple: Ripple) {
		if (!this.#sql) return;
		for (const cluster of ripple.clusters) {
			const clusterExists = await this.#sql`
				SELECT 1 FROM clusters WHERE id = ${cluster.id} LIMIT 1;
			`;
			if (clusterExists.length > 0) {
				await this.#sql`
				INSERT INTO ripple_clusters (ripple_id, cluster_id)
				VALUES (${ripple.id}, ${cluster.id})
				RETURNING ripple_id, cluster_id;
				`;
			}
		}
	}

	private async combineOverlappingRipples(ripples: Ripple[]): Promise<Ripple[]> {
		console.log('considering ripples:', { rippleIds: ripples.map(r => r.id) });
		console.time('combineOverlappingRipples');
		const metrics = {
			initialRipples: ripples.length,
			mergedRipples: 0,
		};

		let combinedRipples: Ripple[] = [];
		let processed = new Set<number>();
		let mergeLog: { source: number[], result: number }[] = []; // track merges

		// iterate through all ripples to find overlaps
		for (let i = 0; i < ripples.length; i++) {
			if (processed.has(i)) continue;

			// deep clone current ripple
			let currentRipple = JSON.parse(JSON.stringify(ripples[i]));
			processed.add(i);
			let mergedIds = [currentRipple.id]; // track ids being merged

			// check other ripples for potential merging
			for (let j = 0; j < ripples.length; j++) {
				if (i === j || processed.has(j)) continue;

				if (this.distance(currentRipple, ripples[j]) - ripples[j].radius - currentRipple.radius <= this.rippleThreshold) {
					mergedIds.push(ripples[j].id); // add merged ripple id
					currentRipple.clusters = [...currentRipple.clusters, ...ripples[j].clusters];
					const { x, y } = this.calculateCenter(currentRipple.clusters);
					currentRipple.x = x;
					currentRipple.y = y;
					currentRipple.radius = this.calculateRadius(currentRipple.clusters);
					processed.add(j);
					metrics.mergedRipples++;
				}
			}
			combinedRipples.push(currentRipple);

			// log merge if multiple ripples were combined
			if (mergedIds.length > 1) {
				console.log('Merged ripples:', { sourceIds: mergedIds });
			}
		}

		console.log('Ripple Combination Metrics:', {
			...metrics,
			finalRipples: combinedRipples.length,
			timestamp: new Date().toISOString()
		});
		console.timeEnd('combineOverlappingRipples');
		return combinedRipples;
	}

	private createNewRipple(clusters: Cluster[], startIdx: number, rippled: Set<number>): Ripple {
		let innerRippled = new Set<number>();
		let rippleClusters: Cluster[] = [clusters[startIdx]];
		let runningCenter = this.calculateCenter(rippleClusters);
		innerRippled.add(startIdx);

		// find nearby clusters to add to ripple
		for (let k = startIdx; k < clusters.length; k++) {
			if (startIdx !== k && !innerRippled.has(k)) {
				// check if cluster is within threshold distance
				if (
					this.distance(runningCenter, clusters[k]) -
					clusters[k].radius <=
					this.rippleThreshold
				) {
					rippleClusters.push(clusters[k]);
					runningCenter = this.calculateCenter(rippleClusters);
					innerRippled.add(k);
				}
			}
		}

		// mark all included clusters as processed
		innerRippled.forEach(idx => rippled.add(idx));

		// create new ripple obj
		return {
			id: -1,
			x: runningCenter.x,
			y: runningCenter.y,
			radius: this.calculateRadius(rippleClusters),
			clusters: rippleClusters,
			songs: [],
			artists: [],
		};
	}

	async createRipples(clusters: Cluster[], songs: SongAristsGenres[]): Promise<Ripple[]> {
		console.time('createRipples:total');
		const metrics = {
			existingRipplesProcessed: 0,
			newRipplesCreated: 0,
			clustersProcessed: clusters.length,
			songsProcessed: songs.length,
			combinedRipples: 0,
			dbOperations: 0
		};

		const ripples: Ripple[] = [];
		let rippled = new Set<number>();

		// process existing ripples
		console.time('createRipples:existingRipples');
		const existingRippleMap = new Map<number, Ripple>(); // track ripples by id

		for (const cluster of clusters) {
			if (rippled.has(clusters.indexOf(cluster))) continue; // skip if already processed

			console.time('findNearbyRipples');
			const nearbyRipples = await this.findNearbyRipples(cluster);
			console.timeEnd('findNearbyRipples');
			console.log('cluster:', { clusterId: cluster.id, clusterX: cluster.x, clusterY: cluster.y, clusterRadius: cluster.radius });
			console.log('nearby ripples:', { nearbyRipples: nearbyRipples.map(r => r.id) });

			metrics.dbOperations++;
			metrics.existingRipplesProcessed += nearbyRipples.length;

			for (const rippleData of nearbyRipples) {
				// get or create ripple obj
				let ripple = existingRippleMap.get(rippleData.ripple_id) || {
					id: rippleData.ripple_id,
					x: rippleData.x,
					y: rippleData.y,
					radius: rippleData.radius,
					clusters: rippleData.clusters,
					songs: [],
					artists: [],
				};

				// check distance
				if (this.distance(cluster, ripple) - ripple.radius - cluster.radius <= this.rippleThreshold) {
					console.time('processExistingRipple');
					ripple.clusters.push(cluster);
					const { x, y } = this.calculateCenter(ripple.clusters);
					ripple.x = x;
					ripple.y = y;
					ripple.radius = this.calculateRadius(ripple.clusters);

					existingRippleMap.set(ripple.id, ripple); // update map
					rippled.add(clusters.indexOf(cluster));
					console.timeEnd('processExistingRipple');
				}
			}
		}

		console.log('existing ripples ids:', { existingRippleIds: Array.from(existingRippleMap.keys()) });

		// persist all modified ripples once
		for (const ripple of existingRippleMap.values()) {
			await this.persistRipple(ripple);
			await this.createRippleAssociations(ripple, songs);
			metrics.dbOperations += 2;
		}

		console.timeEnd('createRipples:existingRipples');

		// create new ripples for unprocessed clusters
		console.time('createRipples:newRipples');
		for (let i = 0; i < clusters.length; i++) {
			if (rippled.has(i)) continue;
			console.time('createNewRipple');
			const newRipple = this.createNewRipple(clusters, i, rippled);
			ripples.push(newRipple);
			metrics.newRipplesCreated++;
			console.log('Created new ripple:', { clusterId: clusters[i].id });
			console.timeEnd('createNewRipple');
		}
		console.timeEnd('createRipples:newRipples');

		// combine ripples
		console.time('createRipples:combineRipples');
		const combinedRipples = await this.combineOverlappingRipples(ripples);
		metrics.combinedRipples = combinedRipples.length;
		console.timeEnd('createRipples:combineRipples');

		// persist combined ripples
		console.time('createRipples:persistCombined');
		for (const ripple of combinedRipples) {
			console.time('persistRipple');
			ripple.id = await this.persistRipple(ripple);
			console.log('Persisted ripple:', {
				rippleId: ripple.id,
				clusterCount: ripple.clusters.length
			});
			await this.createRippleAssociations(ripple, songs);
			await this.createClusterRippleAssociations(ripple);
			metrics.dbOperations += 3;

			// create user association
			if (this.#sql && this.#session?.user?.id) {
				await this.#sql`
				INSERT INTO ripple_users (ripple_id, user_id)
				VALUES (${ripple.id}, ${this.#session.user.id})
				ON CONFLICT (ripple_id, user_id)
				DO UPDATE SET updated_at = NOW();
				`;
				metrics.dbOperations++;
			}
			console.timeEnd('persistRipple');
		}
		console.timeEnd('createRipples:persistCombined');

		console.timeEnd('createRipples:total');
		console.log('Ripple Creation Metrics:', {
			...metrics,
			finalRippleCount: combinedRipples.length,
			processedClusters: rippled.size,
			timestamp: new Date().toISOString()
		});

		return combinedRipples;
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
					if (this.#sql && genre.x !== -1 && genre.y !== -1 && genre.name) {
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
		if (!this.#sql || !this.#session?.user) return [];

		const result = await this.#sql`
			SELECT DISTINCT ripple_id as "rippleId" 
			FROM ripple_users 
			WHERE user_id = ${this.#session.user.id}
		`;

		return result.map(record => Number(record.rippleId));
	}

	public async fetchSpotifyIdsOfRipple(rippleId: number) {
		const spotifyIds = [];
		if (this.#sql) {
			const result = await this.#sql`
				SELECT DISTINCT s.spotify_id
				FROM songs s
				JOIN ripple_songs rs ON s.id = rs.song_id
				WHERE rs.ripple_id = ${rippleId};
			`;

			for (const record of result) {
				let spotifyId = record.spotify_id;
				spotifyIds.push(spotifyId);
			}
		}

		return spotifyIds;
	}

	public async fetchSpotifySongIds(
		rippleIds: number[]
	): Promise<Map<Number, string[]>> {
		const rippleToIds = new Map<Number, string[]>();

		for (const rippleId of rippleIds) {
			const _spotifyIds = await this.fetchSpotifyIdsOfRipple(rippleId);
			rippleToIds.set(rippleId, _spotifyIds);
		}

		return rippleToIds;
	}

	public async postCommentToRipple(
		text: string,
		rippleId: number
	): Promise<Comment | null> {
		if (!this.#sql || !this.#session?.user?.id) return null;

		const response = await this.#sql`
			WITH inserted_comment AS (
				INSERT INTO comments (text, ripple_id, user_id)
				VALUES (${text}, ${rippleId}, ${Number(this.#session.user.id)})
				RETURNING id, text, ripple_id, user_id, created_at, updated_at
			)
			SELECT
				c.id,
				c.text,
				c.created_at,
				c.updated_at,
				json_build_object(
					'id', u.id,
					'name', u.name,
					'email', u.email,
					'image', u.image
				) as user
			FROM inserted_comment c
			JOIN users u ON u.id = c.user_id;
		`;

		return response[0] as Comment;
	}

	public async getCommentsForRipple(
		rippleId: number,
		limit: number = 50,
		offset: number = 0
	): Promise<Comment[]> {
		if (!this.#sql) return [];

		const response = await this.#sql`
			SELECT
				c.id,
				c.text,
				c.created_at,
				c.updated_at,
				json_build_object(
					'id', u.id,
					'name', u.name,
					'email', u.email,
					'image', u.image
				) as user
			FROM comments c
			JOIN users u ON c.user_id = u.id
			WHERE c.ripple_id = ${rippleId}
			ORDER BY c.created_at ASC
			LIMIT ${limit}
			OFFSET ${offset};
		`;

		return response as Comment[];
	}
}

export default NeonClient;
