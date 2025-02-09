interface CommentProps {
  comment: {
    id: string;
    content: string;
    createdAt: string;
    author: string;
    likes: number;
    authorImage?: string; // add this to your Comment type if not already present
    trackTime?: number; // add track timestamp
  };
}

const Comment = ({ comment }: CommentProps) => {
  // fmt track time to mm:ss
  const formatTime = (seconds: number = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="overflow-hidden relative p-3 rounded-xl transition-all duration-200 hover:scale-[1.02] group bg-gradient-to-r from-[#DEDCE1] to-[#D2D1D8]">
      {/* accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-neutral-800 group-hover:bg-indigo-500 transition-colors" />

      <div className="ml-1 flex gap-3 items-start">
        {/* profile and content */}
        <div className="flex gap-2 flex-1">
          <div className="w-7 h-7 rounded-full bg-neutral-200 overflow-hidden shrink-0">
            {comment.authorImage ? (
              <img
                src={comment.authorImage}
                alt={comment.author}
                className="w-full h-full object-cover"
              />
            ) : (
              // fallback avatar
              <div className="w-full h-full bg-neutral-300 flex items-center justify-center text-sm text-neutral-600">
                {comment.author[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{comment.author}</span>
              <span className="text-xs text-neutral-500">•</span>
              <span className="text-xs text-neutral-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* white bubble for comment content */}
            <div className="flex items-center gap-2 bg-[#EAE9EB] p-2 rounded-lg">
              {comment.trackTime !== undefined && (
                <div className="text-sm font-medium text-neutral-500 w-12">
                  {formatTime(comment.trackTime)}
                </div>
              )}
              <p className="text-sm text-neutral-700">{comment.content}</p>
            </div>

            {/* <div className="text-xs text-neutral-500">
              {comment.likes} likes
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comment;
