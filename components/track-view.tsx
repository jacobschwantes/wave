import Comment from "./comment";
import Image from "next/image";
import { Button } from "./ui/button";
import {
	ArrowLeft,
	Heart,
	ThumbsDown,
	ThumbsUp,
	HeartCrack,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Waveform from "./waveform";
import { useState } from "react";
import { useTrackContext } from "@/context/track-context";
import { Track } from "@/types/track";

// interface Track {
//   id: string;
//   title: string;
//   artist: string;
//   albumArt?: string;
//   duration: number;
//   comments: Comment[];
//   reactions: Reaction[];
//   trackTime: number;
// }

interface Reaction {
	id: string;
	type: string;
	count: number;
}

interface Comment {
	id: string;
	content: string;
	createdAt: string;
	author: string;
	likes: number;
	commentTime: number;
}

const TrackView = () => {
	const { selectedTrack } = useTrackContext();
	const router = useRouter();
	const [hoveredCommentTime, setHoveredCommentTime] = useState<
		number | undefined
	>();
	const [newComment, setNewComment] = useState("");

	const sampleComments: Comment[] = [
		{
			id: "1",
			content: "This is a comment",
			createdAt: "2025-02-01",
			author: "John Doe",
			likes: 10,
			commentTime: 5000,
		},
		{
			id: "2",
			content: "This is a comment",
			createdAt: "2025-02-01",
			author: "John Doe",
			likes: 10,
			commentTime: 12200,
		},
		{
			id: "3",
			content: "This is a comment",
			createdAt: "2025-02-01",
			author: "John Doe",
			likes: 10,
			commentTime: 16200,
		},
		{
			id: "4",
			content: "This is a comment",
			createdAt: "2025-02-01",
			author: "John Doe",
			likes: 10,
			commentTime: 16200,
		},
		{
			id: "5",
			content: "This is a comment",
			createdAt: "2025-02-01",
			author: "John Doe",
			likes: 10,
			commentTime: 16200,
		},
		{
			id: "6",
			content: "This is a comment",
			createdAt: "2025-02-01",
			author: "John Doe",
			likes: 10,
			commentTime: 16200,
		},
	];

	return (
		<div className="absolute left-1/2 translate-x-6 top-1/4 -translate-y-1/4 z-50">
			<div className="h-full max-w-5xl mx-auto p-6">
				<div className="h-full flex flex-col">
					<div className="grid grid-cols-2 gap-8 flex-1 min-h-0">
						{/* right column - comments */}
						<div className="opacity-0 translate-y-4 animate-slide-fade h-full flex flex-col">
							<div className="flex items-center gap-4 text-sm text-neutral-500 mb-6">
								{/* {selectedTrack?.reactions.map((reaction, index) => (
									<div
										key={reaction.id}
										className={`flex items-center gap-1 ${
											index > 0 ? "ml-3" : ""
										}`}
									>
										{reaction.type === "like" ? (
											<ThumbsUp className="w-4 h-4" />
										) : reaction.type === "dislike" ? (
											<ThumbsDown className="w-4 h-4" />
										) : reaction.type === "love" ? (
											<Heart className="w-4 h-4" />
										) : reaction.type === "hate" ? (
											<HeartCrack className="w-4 h-4" />
										) : null}
										<span>{reaction.count}</span>
									</div>
								))} */}
							</div>

							<div className="mb-6">
								<Waveform
									trackTime={120000}
									duration={selectedTrack?.duration_ms}
									commentTime={
										hoveredCommentTime ? hoveredCommentTime : undefined
									}
								/>
							</div>

							<div
								className="flex-1 overflow-y-auto overflow-x-hidden mb-4"
								style={{ maxHeight: "calc(50vh - 100px)" }}
							>
								<div
									className="space-y-3"
									onMouseLeave={() => setHoveredCommentTime(undefined)}
								>
									{sampleComments
										.sort((a, b) => a.commentTime - b.commentTime)
										.map((comment, index) => (
											<div
												key={comment.id}
												className="opacity-0 translate-x-8 animate-slide-fade px-4 py-2"
												style={{
													animationDelay: `${(index + 2) * 150}ms`,
												}}
												onMouseEnter={() =>
													setHoveredCommentTime(comment.commentTime)
												}
											>
												<Comment comment={comment} />
											</div>
										))}
								</div>
							</div>

							<div className="border-t pt-4">
								<form className="flex gap-2">
									<input
										type="text"
										value={newComment}
										onChange={(e) => setNewComment(e.target.value)}
										placeholder="Add a comment..."
										className="flex-1 px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-neutral-400"
									/>
									<Button type="submit">Post</Button>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TrackView;
