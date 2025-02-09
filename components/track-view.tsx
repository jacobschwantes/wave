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

interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  duration: number;
  comments: Comment[];
  reactions: Reaction[];
  trackTime: number;
}

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

interface TrackViewProps {
  track: Track;
}

const TrackView = ({ track }: TrackViewProps) => {
  const router = useRouter();
  const [hoveredCommentTime, setHoveredCommentTime] = useState<
    number | undefined
  >();
  const [newComment, setNewComment] = useState("");

  return (
    <div className="h-screen overflow-hidden">
      <div className="h-full max-w-7xl mx-auto p-6">
        <div className="h-full flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex gap-2 animate-slide-fade mb-6 w-full justify-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="grid grid-cols-2 gap-8 flex-1 min-h-0">
            {/* left column */}
            <div className="space-y-6 opacity-0 translate-y-4 animate-slide-fade">
              {track.albumArt ? (
                <Image
                  src={track.albumArt}
                  alt={`${track.title} cover`}
                  className="w-full aspect-square rounded-lg"
                  width={500}
                  height={500}
                />
              ) : (
                <div className="w-full aspect-square rounded-lg bg-neutral-100 flex items-center justify-center">
                  <p className="text-neutral-400 text-sm">no art available</p>
                </div>
              )}

              <div className="flex flex-row gap-4 justify-between items-start">
                <div className="flex flex-col gap-2 items-start">
                  <h2 className="text-2xl font-bold">{track.title}</h2>
                  <p className="text-lg text-neutral-600">{track.artist}</p>
                </div>
              </div>
            </div>

            {/* right column - comments */}
            <div className="opacity-0 translate-y-4 animate-slide-fade h-full flex flex-col">
              <div className="flex items-center gap-4 text-sm text-neutral-500 mb-6">
                {track.reactions.map((reaction, index) => (
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
                ))}
              </div>

              <div className="mb-6">
                <Waveform
                  trackTime={track.trackTime}
                  duration={track.duration}
                  commentTime={
                    hoveredCommentTime ? hoveredCommentTime : undefined
                  }
                />
              </div>

              <div
                className="flex-1 overflow-y-auto mb-4"
                style={{ maxHeight: "calc(100vh - 400px)" }}
              >
                <div
                  className="space-y-3"
                  onMouseLeave={() => setHoveredCommentTime(undefined)}
                >
                  {track.comments
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
