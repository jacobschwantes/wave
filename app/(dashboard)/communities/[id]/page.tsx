import CommunityPageClient from "@/components/community";
import SpotifyClient from "@/lib/spotify/SpotifyClient";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const spotify = await SpotifyClient.getInstance();
  const recentTracksPayload = await spotify.getRecentlyPlayedTracks();
  return (
    <div className="flex-1 overflow-hidden">
      <CommunityPageClient recentTracks={recentTracksPayload} params={params} />
    </div>
  );
}
