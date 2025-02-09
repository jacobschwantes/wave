import NeonClient, { Artist, Song } from "../database/NeonClient";

export type SongAristsGenres = {
	id: number;
	spotify_id: string;
	artists: {
		id: number;
		spotify_id: string;
		genres: {
			name: string;
			id: number;
			x: number;
			y: number;
		}[];
	}[];
};

export type ClientSong = {
	id: string;
	title: string;
	artist: string;
	album: string;
	albumCover: string;
	durationMs: number;
	previewUrl: string;
	spotifyUrl: string; 
}

class SpotifyClient {
	private static instance: SpotifyClient | null = null;
	#neonClient: NeonClient | null = null;
	#accessToken: string = "";
	#refreshToken: string = "";
	#expiresAt: number = 0;
	#userRecentSongs: SongAristsGenres[] = [];
	private readonly SPOTIFY_BASE_URL: string = "https://api.spotify.com/v1/";

	private constructor() {}

	public static async getInstance(): Promise<SpotifyClient> {
		if (!SpotifyClient.instance) {
			SpotifyClient.instance = new SpotifyClient();
			await SpotifyClient.instance.initialize();
		}

		return SpotifyClient.instance;
	}

	private async initialize(): Promise<void> {
		try {
			this.#neonClient = await NeonClient.getInstance();
			const tokens = await this.#neonClient.fetchSpotifyTokens();

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

	async #refreshAccessToken(): Promise<void> {
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

			const response = await fetch(url, payload);

			if (!response.ok) {
				console.log("Spotify Request Failed");
				return;
			}

			const refreshedTokens = await response.json();

			this.#accessToken = refreshedTokens.access_token;
			this.#expiresAt =
				Math.floor(Date.now() / 1000) + refreshedTokens.expires_in;
			if (refreshedTokens.refresh_token) {
				this.#refreshToken = refreshedTokens.refresh_token;
			}

			this.#neonClient.updateSpotifyTokens(
				this.#accessToken,
				this.#refreshToken,
				this.#expiresAt
			);
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

		const response = await fetch(this.SPOTIFY_BASE_URL + url + queryString, {
			headers: {
				Authorization: `Bearer ${await this.getAccessToken()}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Spotify API error: ${response.status}`);
		}

		return await response.json();
	}

	private mapSpotifyTrackToCustomSong(spotifyTrack: any) {
		return {
			id: spotifyTrack.id,
			title: spotifyTrack.name,
			artist: spotifyTrack.artists[0].name,
			album: spotifyTrack.album.name,
			albumCover: spotifyTrack.album.images.length > 0 ? spotifyTrack.album.images[0].url : null,
			durationMs: spotifyTrack.duration_ms,
			previewUrl: spotifyTrack.preview_url,
			spotifyUrl: spotifyTrack.external_urls.spotify
		};
	}

	async getBatchSongs(ids: string[]): Promise<ClientSong[]> {
		if (ids.length === 0) return [];
		const params = { ids: ids.join(","), market: "US" };
		const response = await this.#makeSpotifyAPIRequest(
			"tracks",
			params
		);

		const songs: ClientSong[] = response.tracks.map((track: any) => this.mapSpotifyTrackToCustomSong(track));
		return songs;
	}

	public async getUserSongs(): Promise<Map<Number, ClientSong[]>> {
		if (!this.#neonClient) return new Map();
		const ripples = await this.#neonClient.fetchRipples();

		const rippleToIds = await this.#neonClient.fetchSpotifySongIds(ripples)
		const rippleToClientSongs = new Map<Number, ClientSong[]>();
		let i = 0;
		for (const spotifyIds of rippleToIds.values()) {
			if (spotifyIds.length === 0) continue
			const songs = await this.getBatchSongs(spotifyIds);
			const keysArray = Array.from(rippleToIds.keys()); // Convert iterator to array
			rippleToClientSongs.set(keysArray[i], songs);
			i++;
		}

		return rippleToClientSongs;
	}

	public async getSongsFromRippleId(rippleId: number): Promise<ClientSong[]> {
		if (!this.#neonClient) return [];
		const spotifyIds = await this.#neonClient.fetchSpotifyIdsOfRipple(rippleId);
		const songs = await this.getBatchSongs(spotifyIds);
		return songs;
	}

	async #getRecentlyPlayedTracks(
		limit: number = 20,
		after: string = "",
		before: string = ""
	) {
		const params: Record<string, string> = { limit: limit.toString() };
		if (after) {
			params["after"] = after;
		}
		if (before) {
			params["before"] = before;
		}

		const response = await this.#makeSpotifyAPIRequest(
			"me/player/recently-played",
			params
		);

		response.items.forEach((song: any) => {
			const songArtistsGenres: SongAristsGenres = {
				id: -1,
				spotify_id: song.track.id,
				artists: song.track.artists.map((artist: any) => ({
					id: -1, // Default id, can be updated later
					spotify_id: artist.id,
					genres: [], // Empty array for genres, to be populated later
				})),
			};
			this.#userRecentSongs.push(songArtistsGenres); // Add to #userRecentSongs
		});

		return response.items;
	}

	public appendDbIdToSongObj(id: number, spotify_id: string) {
		this.#userRecentSongs = this.#userRecentSongs.map((song) => {
			if (song.spotify_id === spotify_id) {
				song.id = id;
			}
			return song;
		});
	}

	public appendDbIdToArtistObj(id: number, spotify_id: string) {
		this.#userRecentSongs = this.#userRecentSongs.map((song) => {
			song.artists = song.artists.map((artist) => {
				if (artist.spotify_id === spotify_id) {
					return { ...artist, id }; // Create a new object with the updated id
				} else {
					return artist;
				}
			});
			return { ...song }; // Create a new object for the song
		});
	}

	public appendDbIdToGenreObj(id: number, x: number, y: number, name: string) {
		this.#userRecentSongs = this.#userRecentSongs.map((song) => {
			song.artists = song.artists.map((artist) => {
				artist.genres = artist.genres.map((genre) => {
					if (genre.name === name) {
						return { ...genre, id: id, x: x, y: y };
					}
					return genre
				})
				return { ...artist };
			});
			return { ...song };
		});
	}

	#getArtistsFromSongs(rawSongData: any[]): Artist[] {
		const artistsToUpsert = new Map();

		rawSongData.forEach((item: any) => {
			item.track.artists.forEach((artist: any) => {
				if (!artistsToUpsert.has(artist.id)) {
					artistsToUpsert.set(artist.id, {
						spotify_id: artist.id,
						name: artist.name,
					});
				}
			});
		});

		const artists: Artist[] = [...artistsToUpsert.values()];

		return artists;
	}

	async #getGenresFromArtists(artists: Artist[]) {
		const ids = artists.map((artist) => artist.spotify_id);
		const params = { ids: ids.join(",") };

		const response = await this.#makeSpotifyAPIRequest("artists", params);

		response.artists.forEach((artist: any) => {
			this.#userRecentSongs = this.#userRecentSongs.map((song) => {
				song.artists = song.artists.map((_artist) => {
					if (_artist.spotify_id === artist.id) {
						const genres = artist.genres.map((genre: any) => {return { "name": genre, "id": -1, "x": -1, "y": -1 }})
						return { ..._artist, genres: genres }; // Create a new object with the updated id
					} else {
						return _artist;
					}
				});
				return { ...song };
			});
		});

		const genres: string[] = response.artists.flatMap((artist: any) => artist.genres);

		return [...new Set(genres)]
	}

	public async computeClustersAndIdentifyRipples() {
		if (!this.#neonClient) return;
		const rawSongData = await this.#getRecentlyPlayedTracks(50);
		const dbSongs: Song[] = await this.#neonClient.upsertSongs(rawSongData);
		const dbArtists = await this.#neonClient.upsertArtists(
			this.#getArtistsFromSongs(rawSongData)
		);
		const rawGenreData = await this.#getGenresFromArtists(dbArtists);
		const dbGenres = await this.#neonClient.upsertGenres(rawGenreData);
		await this.#neonClient.generateRelationships(this.#userRecentSongs);
		const clusters = await this.#neonClient.createClusters(dbGenres);
		await this.#neonClient.createRipples(clusters, this.#userRecentSongs);
		await this.#neonClient.updateUserRippleRecomputeAt();
	}

	public async getRecentlyPlayedTracks() {
		return this.#makeSpotifyAPIRequest("me/player/recently-played");
	}

	public async getArtistImage(artistName: string): Promise<string | null> {
		try {
			// search for artist
			const params = {
				q: artistName,
				type: 'artist',
				limit: '1'
			};
			
			const response = await this.#makeSpotifyAPIRequest('search', params);
			
			if (response.artists.items.length > 0) {
				const artist = response.artists.items[0];
				// get the highest quality image available
				return artist.images[0]?.url || null;
			}
			
			return null;
		} catch (error) {
			console.error('Failed to fetch artist image:', error);
			return null;
		}
	}
}

export default SpotifyClient;
