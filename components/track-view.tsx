interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  duration: number;
  comments: Comment[];
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: string;
  likes: number;
}

interface TrackViewProps {
  track: Track;
}

const TrackView = ({ track }: TrackViewProps) => {
  // fmt duration to mm:ss
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="grid grid-cols-2 gap-6 p-4">
      {/* left col - track info */}
      <div className="space-y-4">
        {track.albumArt ? (
          <img
            src={track.albumArt}
            alt={`${track.title} cover`}
            className="w-full aspect-square rounded-lg shadow-md"
          />
        ) : (
          <div className="w-full aspect-square bg-neutral-200 rounded-lg" />
        )}
        <div>
          <h2 className="text-2xl font-bold">{track.title}</h2>
          <p className="text-lg text-neutral-600">{track.artist}</p>
          <p className="text-sm text-neutral-500 mt-1">
            {formatDuration(track.duration)}
          </p>
        </div>
      </div>

      {/* right col - comments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Comments</h3>
        <div className="space-y-3">
          {track.comments.map((comment) => (
            <div
              key={comment.id}
              className="p-3 bg-neutral-50 rounded-lg border border-neutral-200"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium">{comment.author}</span>
                <span className="text-sm text-neutral-500">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-neutral-700">{comment.content}</p>
              <div className="mt-2 text-sm text-neutral-500">
                {comment.likes} likes
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackView;
