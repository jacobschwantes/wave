import { ClientSong } from "@/lib/spotify/SpotifyClient";
import { RippleCard } from "./ripple-card";
import { Ripple } from "@/types/ripple";
import { AudioWaveform } from "lucide-react";

export function RippleSection({
	heading,
	rippleToSongs
}: {
	heading: string;
	rippleToSongs: Map<Number, ClientSong[]>;
}) {
	const rippleIds = Array.from(rippleToSongs.keys());
	const songs = Array.from(rippleToSongs.values());

	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<h2 className="text-2xl font-bold">{heading}</h2>
				<AudioWaveform className="w-5 h-5" />
			</div>
			<div className="grid grid-cols-2 gap-12">
				{songs.map((_songs, id) => (
					<RippleCard key={id} rippleId={rippleIds[id] as number} songs={_songs} />
				))}
			</div>
		</section>
	);
}
