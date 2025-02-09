"use client";
import { use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TrackView from "@/components/track-view";

export default function CommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // get trackId from query params
  const trackId = searchParams.get("track");

  const tracks = [
    {
      id: "1",
      title: "Song 1",
      artist: "Artist 1",
      duration: 210001,
      trackTime: 0,
      albumArt: undefined,
      reactions: [
        {
          id: "1",
          type: "like",
          count: 20,
        },
        {
          id: "2",
          type: "dislike",
          count: 10,
        },
        {
          id: "3",
          type: "love",
          count: 10,
        },
        {
          id: "4",
          type: "hate",
          count: 10,
        },
      ],
      comments: [
        {
          id: "3",
          content: "This is a third comment",
          createdAt: "2021-01-03",
          author: "Jane",
          likes: 30,
          commentTime: 3800,
        },
        {
          id: "4",
          content: "This is a comment",
          createdAt: "2021-01-01",
          author: "Sam",
          likes: 10,
          commentTime: 152000,
        },
        {
          id: "5",
          content: "This is another comment",
          createdAt: "2021-01-02",
          author: "John",
          likes: 20,
          commentTime: 170001,
        },
        {
          id: "6",
          content: "This is a third comment",
          createdAt: "2021-01-03",
          author: "Jane",
          likes: 30,
          commentTime: 18400,
        },
        {
          id: "8",
          content: "This is another comment",
          createdAt: "2021-01-02",
          author: "John",
          likes: 20,
          commentTime: 12000,
        },
        {
          id: "15",
          content: "This is a third comment",
          createdAt: "2021-01-03",
          author: "Jane",
          likes: 30,
          commentTime: 18400,
        },
      ],
    },
    {
      id: "2",
      title: "Song 2",
      artist: "Artist 2",
      duration: 20000,
      trackTime: 0,
      albumArt: "/images/default-album.jpg",
      reactions: [],
      comments: [
        {
          id: "2",
          content: "Comment 2",
          createdAt: "2021-01-02",
          author: "John",
          likes: 20,
          commentTime: 8000,
        },
      ],
    },
  ];

  // find selected track from trackId
  const selectedTrack = trackId ? tracks.find((t) => t.id === trackId) : null;

  // update query params when selecting track
  const handleTrackSelect = (track: (typeof tracks)[0] | null) => {
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
          <TrackView track={selectedTrack} />
        </div>
      ) : (
        <>
          <h1>community: {id}</h1>
          <div className="space-y-2">
            {tracks.map((track) => (
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
