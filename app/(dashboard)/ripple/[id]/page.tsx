import RippleViewClient from "@/components/ripple-view-client";
import NeonClient from "@/lib/database/NeonClient";
import SpotifyClient from "@/lib/spotify/SpotifyClient";

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: { songs?: string };
}) {
  const { id } = await params;
  const spotify = await SpotifyClient.getInstance();
  const neon = await NeonClient.getInstance()
  const songs = searchParams.songs 
    ? JSON.parse(searchParams.songs) 
    : await spotify.getSongsFromRippleId(Number(id));
  const chats = await neon.getCommentsForRipple(Number(id));

  return (
    <div className="flex-1 overflow-hidden">
      <div className="flex-1">
        <RippleViewClient tracks={songs} rippleId={id} chats={chats} />
      </div>
    </div>
  );
}
