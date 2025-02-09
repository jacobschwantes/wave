"use client";
import { useState, use } from "react";
import TrackView from "@/components/track-view";

export default function CommunityPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const [selectedTrack, setSelectedTrack] = useState(null);

	const tracks = [
		{
			id: "1",
			title: "Song 1",
			artist: "Artist 1",
			duration: 10000,
			albumArt: "https://via.placeholder.com/150",
			comments: [
				{
					id: "1",
					content: "Comment 1",
					createdAt: "2021-01-01",
					author: "User 1",
					likes: 10,
				},
			],
		},
		{
			id: "2",
			title: "Song 2",
			artist: "Artist 2",
			duration: 20000,
			albumArt: "https://via.placeholder.com/150",
			comments: [
				{
					id: "2",
					content: "Comment 2",
					createdAt: "2021-01-02",
					author: "User 2",
					likes: 20,
				},
			],
		},
		{
			id: "3",
			title: "Song 3",
			artist: "Artist 3",
			duration: 30000,
			albumArt: "https://via.placeholder.com/150",
			comments: [
				{
					id: "3",
					content: "Comment 3",
					createdAt: "2021-01-03",
					author: "User 3",
					likes: 30,
				},
			],
		},
	];

	return (
		<div>
			{selectedTrack ? (
				<div>
					<button 
						onClick={() => setSelectedTrack(null)}
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
								onClick={() => setSelectedTrack(track)}
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
