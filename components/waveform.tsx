import { useEffect, useRef } from "react";

interface WaveformProps {
  trackTime: number; // percentage (0-100)
  duration: number; // total duration in seconds
  commentTime?: number; // percentage (0-100)
}

// mock spotify-like audio analysis data
const mockAudioData = {
  segments: Array(100)
    .fill(0)
    .map(() => ({
      // loudness typically ranges from -60 to 0 db
      loudness: Math.random() * -30 - 5, // random between -35 and -5 db
      duration: 0.1, // 100ms per segment for simplicity
    })),
};

const Waveform = ({ trackTime, duration, commentTime }: WaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevCommentTime = useRef<number | undefined>(commentTime);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // convert ms to percentages
    const trackTimePercent = (trackTime / duration) * 100;
    const commentTimePercent = commentTime
      ? (commentTime / duration) * 100
      : undefined;

    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height); // use clearRect instead of fillStyle transparent

    // normalize loudness values to canvas height
    const maxLoudness = -5;
    const minLoudness = -35;
    const normalizeHeight = (loudness: number) => {
      return (
        ((loudness - minLoudness) / (maxLoudness - minLoudness)) *
        (canvas.height * 0.8)
      );
    };

    // draw waveform
    const barWidth = canvas.width / mockAudioData.segments.length - 1;

    mockAudioData.segments.forEach((segment, i) => {
      const height = normalizeHeight(segment.loudness);
      const x = i * (barWidth + 1);
      const y = (canvas.height - height) / 2;

      // draw bar
      ctx.fillStyle =
        x < (canvas.width * trackTimePercent) / 100 ? "#000" : "#e5e5e5";
      ctx.fillRect(x, y, barWidth, height);
    });

    // animate comment indicator
    const drawCommentIndicator = (progress = 1) => {
      if (typeof commentTimePercent !== "number") return;

      const prevX =
        prevCommentTime.current !== undefined
          ? (canvas.width * prevCommentTime.current) / duration
          : (canvas.width * commentTimePercent) / 100;

      const targetX = (canvas.width * commentTimePercent) / 100;
      const currentX = prevX + (targetX - prevX) * progress;

      // draw center line
      ctx.fillStyle = `rgba(59, 130, 246, ${progress})`; // blue with opacity
      const lineWidth = 12;
      const verticalPadding = 4;

      ctx.beginPath();
      ctx.roundRect(
        currentX - lineWidth / 2,
        -verticalPadding,
        lineWidth,
        canvas.height + verticalPadding * 2,
        lineWidth / 2
      );
      ctx.fill();
    };

    let animationFrame: number;
    let startTime: number;
    const animationDuration = 100; // 300ms transition

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / animationDuration, 1);

      // redraw entire canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // redraw waveform
      mockAudioData.segments.forEach((segment, i) => {
        const height = normalizeHeight(segment.loudness);
        const x = i * (barWidth + 1);
        const y = (canvas.height - height) / 2;
        ctx.fillStyle =
          x < (canvas.width * trackTimePercent) / 100 ? "#000" : "#e5e5e5";
        ctx.fillRect(x, y, barWidth, height);
      });

      drawCommentIndicator(progress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        prevCommentTime.current = commentTime;
      }
    };

    if (commentTime !== prevCommentTime.current) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      // no animation needed, just draw
      drawCommentIndicator();
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [trackTime, duration, commentTime]);

  return (
    <canvas ref={canvasRef} className="w-full h-16" width={1000} height={64} />
  );
};

export default Waveform;
