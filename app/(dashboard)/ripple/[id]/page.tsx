import TopTracks from "@/components/track-container";
import SpotifyClient from "@/lib/spotify/SpotifyClient";

export default async function CommunityPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const spotify = await SpotifyClient.getInstance();
	const recentTracksPayload = await spotify.getRecentlyPlayedTracks();

	const tracks = recentTracksPayload.items.map((item: any) => item.track);

	const { id } = await params;

	return (
		<div className="flex-1 overflow-hidden">
			<div className="flex-1">
				<TopTracks tracks={tracks} rippleId={id} />
			</div>
		</div>
	);
}
