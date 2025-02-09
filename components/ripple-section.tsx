import { RippleCard } from "./ripple-card";
import { Ripple } from "@/types/ripple";
import { AudioWaveform } from "lucide-react";

export function RippleSection({
	heading,
	ripples,
}: {
	heading: string;
	ripples: Ripple[];
}) {
	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<h2 className="text-2xl font-bold">{heading}</h2>
				<AudioWaveform className="w-5 h-5" />
			</div>
			<div className="grid grid-cols-2 gap-12">
				{ripples.map((ripple) => (
					<RippleCard key={ripple.id} ripple={ripple} />
				))}
			</div>
		</section>
	);
}
