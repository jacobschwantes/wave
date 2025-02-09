"use client";
import { use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TrackView from "@/components/track-view";

export default function CommunityPage({ params }: { params: Promise<{ id: string }> }) {
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
			duration: 10000,
			albumArt: null,
			comments: [
				{
					id: "1",
					content: "This is a comment",
					createdAt: "2021-01-01",
					author: "Sam",
					likes: 10,
					trackTime: 73,
				},
				{
					id: "2",
					content: "This is another comment",
					createdAt: "2021-01-02",
					author: "John",
					likes: 20,
					trackTime: 120,
				},
				{
					id: "3",
					content: "This is a third comment",
					createdAt: "2021-01-03",
					author: "Jane",
					likes: 30,
					trackTime: 184,
				},
			],
		},
		{
			id: "2",
			title: "Song 2",
			artist: "Artist 2",
			duration: 20000,
			albumArt: '/images/default-album.jpg',
			comments: [
				{
					id: "2",
					content: "Comment 2",
					createdAt: "2021-01-02",
					author: "John",
					likes: 20,
				},
			],
		},
	];
	
	// find selected track from trackId
	const selectedTrack = trackId ? tracks.find(t => t.id === trackId) : null;
	
	// update query params when selecting track
	const handleTrackSelect = (track: typeof tracks[0] | null) => {
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
					<button 
						onClick={() => handleTrackSelect(null)}
						className="mb-4 text-sm text-gray-600 hover:text-gray-900"
					>
						← back to tracks
					</button>
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
