import { RippleSection } from "@/components/ripple-section";
import SpotifyClient from "@/lib/spotify/SpotifyClient";
import { Waves } from "lucide-react";
import NeonClient from "@/lib/database/NeonClient";

export default async function Home() {
	const spotifyClient = await SpotifyClient.getInstance();	
	const recomputeRipplesAt = await (await NeonClient.getInstance()).fetchRecomputeRipplesTime();
	if (Date.now() / 1000 >= recomputeRipplesAt) {
		await spotifyClient.computeClustersAndIdentifyRipples();
	}
	const rippleToSongs = await spotifyClient.getUserSongs();

  return (
    <div className="flex flex-col gap-16 max-w-4xl mx-auto py-16 px-4">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-medium">Surf's up!</h1>
          <Waves className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted-foreground">
          Dive into music communities we think you'll love
        </p>
      </div>

      <RippleSection
        heading="Recently active ripples"
        rippleToSongs={rippleToSongs}
      />
    </div>
  );
}
