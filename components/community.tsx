"use client";
import { use, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TrackView from "@/components/track-view";

export default function CommunityPageClient({
  params,
  recentTracks,
}: {
  params: Promise<{ id: string }>;
  recentTracks: any;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tracks, setTracks] = useState<any[]>(recentTracks);
  const [tempTracks, setTempTracks] = useState<any[]>([]);

  useEffect(() => {
    setTracks(recentTracks);
    const tempTracks = recentTracks.items.map((item: any) => ({
      id: item.track.id,
      title: item.track.name,
      artist: item.track.artists[0].name,
      albumArt: item.track.album.images[0].url,
      duration: item.track.duration_ms,
    }));

    // add fake data to temp tracks
    const fakeTracks = tempTracks.map((track: any) => ({
      ...track,
      reactions: [{ id: "1", type: "like", count: 0 }],
      comments: [
        {
          id: "1",
          content: "First listen!",
          author: "Anonymous",
          likes: 0,
          commentTime: 16200,
        },
      ],
    }));
    setTempTracks(fakeTracks);
  }, [recentTracks]);

  // get trackId from query params
  const trackId = searchParams.get("track");

  // find selected track from trackId
  const selectedTrack = trackId ? tempTracks.find((t) => t.id === trackId) : null;

  // update query params when selecting track
  const handleTrackSelect = (track: any | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (track) {
      params.set("track", track.id);
    } else {
      params.delete("track");
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div>
      {selectedTrack ? (
        <div>
          <TrackView track={selectedTrack as any} />
        </div>
      ) : (
        <>
          <h1>community: {id}</h1>
          <div className="space-y-2">
            {tempTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => handleTrackSelect(track)}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={track.albumArt || "/default-album.png"}
                    className="w-12 h-12 rounded"
                    alt="album cover"
                  />
                  <div>
                    <p className="font-medium">{track.title}</p>
                    <p className="text-sm text-gray-600">{track.artist}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
