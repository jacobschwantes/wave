import SpotifyClient from "@/lib/spotify/SpotifyClient";

export default async function Home() {
	const spotifyClient = await SpotifyClient.getInstance();

    const token = await spotifyClient.getAccessToken();
    console.log(token)

    const tracks = await spotifyClient.getRecentlyPlayedTracks(40);

	return (
		<main className="wave-bg min-h-screen relative">
            {tracks["items"].map((data: Object, idx: number) => (
                <img key={`track_${idx}`} width={400} height={400} src={data.track.album.images[0].url} />
            ))}
		</main>
	);
}
