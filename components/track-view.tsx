import Comment from './comment';
import Image from 'next/image';

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
    <div className="grid grid-cols-2 gap-8 p-6 max-w-7xl mx-auto">
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
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{track.title}</h2>
          <p className="text-lg text-neutral-600">{track.artist}</p>
          <p className="text-sm text-neutral-500">
            {formatDuration(track.duration)}
          </p>
        </div>
      </div>

      <div className="space-y-6 opacity-0 translate-y-4 animate-slide-fade" style={{ animationDelay: '150ms' }}>
        <h3 className="text-lg font-semibold">Comments</h3>
        <div className="space-y-3">
          {track.comments.map((comment, index) => (
            <div
              key={comment.id}
              className="opacity-0 translate-x-8 animate-slide-fade"
              style={{ 
                animationDelay: `${(index + 2) * 150}ms`,
              }}
            >
              <Comment comment={comment} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackView;
