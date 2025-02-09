import TopTracks from "@/components/track-container";
import SpotifyClient from "@/lib/spotify/SpotifyClient";

export default async function Home() {
	const spotifyClient = await SpotifyClient.getInstance();

	const tracks = await spotifyClient.getRecentlyPlayedTracks(40);

	// Get unique tracks by filtering out duplicates based on track ID
	const uniqueTracks = tracks.items.reduce((acc: any[], item: any) => {
		if (
			!acc.find((existingItem: any) => existingItem.track.id === item.track.id)
		) {
			acc.push(item);
		}
		return acc;
	}, []);

	const tracksArray = uniqueTracks.map((item: any) => item.track);
	console.log(tracksArray.length);

	// console.log(JSON.stringify(tracks, null, 2));
	return (
		<div>
			<TopTracks tracks={tracksArray} />
		</div>
	);
}
