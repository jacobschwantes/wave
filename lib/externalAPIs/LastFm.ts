const BASE_URL = "http://ws.audioscrobbler.com/2.0/";
export async function getGenresByArtistName(artistName: string,): Promise<string[]> {
	try {
		const response = await fetch(
			BASE_URL +
				`?method=artist.getinfo` +
				`&artist=${encodeURIComponent(artistName)}` +
				`&api_key=${process.env.LAST_FM_ID}&format=json`
		);

		const data = await response.json();

		if (data.error) {
			// throw new Error(data.message || 'Artist not found');
			return [];
		}

		const tags = data.artist?.tags?.tag || [];
		const genres = tags.map((tag: any) => tag.name.toLowerCase());

		return genres;
	} catch (error) {
		console.error("Error fetching genres for", artistName, ":", error);
		throw error;
	}
}
