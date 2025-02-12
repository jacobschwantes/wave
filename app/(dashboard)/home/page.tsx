import { Suspense } from "react";
import { ClientSong } from "@/lib/spotify/SpotifyClient";
import SpotifyClient from "@/lib/spotify/SpotifyClient";
import NeonClient from "@/lib/database/NeonClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AudioWaveform, Loader2 } from "lucide-react";
import { RippleCard } from "@/components/ripples/ripple-card";

// ripple section display
function RippleGrid({
  heading,
  rippleMap,
}: {
  heading: string;
  rippleMap: Map<Number, ClientSong[]>;
}) {
  const rippleIds = Array.from(rippleMap.keys());
  const songs = Array.from(rippleMap.values());

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">{heading}</h2>
        <AudioWaveform className="w-5 h-5" />
      </div>
      <div className="grid grid-cols-2 gap-12">
        {songs.map((_songs, id) => (
          <RippleCard
            key={id}
            rippleId={rippleIds[id] as number}
            songs={_songs}
          />
        ))}
      </div>
    </section>
  );
}

// loading skeleton
function RippleSkeleton() {
  const gridItems = Array.from({ length: 3 });
  const albumCovers = Array.from({ length: 5 });

  return (
    <div className="space-y-8">
      <Alert className="bg-blue-500/10">
        <AlertTitle className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Discovering your music patterns
        </AlertTitle>
        <AlertDescription>This might take a minute...</AlertDescription>
      </Alert>
      <div className="grid grid-cols-2 gap-12">
        {gridItems.map((_, i) => (
          <div key={i} className="p-6 rounded-lg border bg-card">
            <div className="space-y-4">
              <div className="flex gap-2">
                {albumCovers.map((_, j) => (
                  <Skeleton key={j} className="h-16 w-16 rounded-sm" />
                ))}
              </div>
              <Skeleton className="h-6 w-64" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function RippleContent() {
  const [spotify, db] = await Promise.all([
    SpotifyClient.getInstance(),
    NeonClient.getInstance()
  ]);
  
  const nextComputeTime = await db.fetchRecomputeRipplesTime();
  if (Date.now() / 1000 >= nextComputeTime) {
    await spotify.computeClustersAndIdentifyRipples();
  }

  const rippleMap = await spotify.getRippleSongs();
  return (
    <RippleGrid
      heading="Recently active ripples"
      rippleMap={rippleMap}
    />
  );
}

export default function Home() {
  return (
    <div className="flex flex-col gap-16 max-w-4xl mx-auto py-16 px-4">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Surf's up! 🏄‍♂️</h1>
          <p className="text-muted-foreground">
            Here are your latest music ripples.
          </p>
        </div>
        <Suspense fallback={<RippleSkeleton />}>
          <RippleContent />
        </Suspense>
      </div>
    </div>
  );
}
