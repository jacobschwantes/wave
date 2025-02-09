import TopTracks from "@/components/track-container";
import SpotifyClient from "@/lib/spotify/SpotifyClient";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const spotify = await SpotifyClient.getInstance();
  const songs = await spotify.getSongsFromRippleId(Number(id));

  return (
    <div className="flex-1 overflow-hidden">
      <div className="flex-1">
        <TopTracks tracks={songs} rippleId={id} />
      </div>
    </div>
  );
}
