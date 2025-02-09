import SpotifyClient from "@/lib/spotify/SpotifyClient";

export default async function Home() {
	const spotifyClient = await SpotifyClient.getInstance();

    const token = await spotifyClient.getAccessToken();
    console.log(token)

    const tracks = await spotifyClient.computeClustersAndIdentifyRipples();

	return (
		<main className="wave-bg min-h-screen relative">
		</main>
	);
}
