import { Ripple } from "@/types/ripple";
import { RippleSection } from "@/components/ripple-section";

const sampleRipples: Ripple[] = [
	{
		id: "1",
		name: "Frank Ocean, Dijon, Daniel Caesar",
		memberCount: 10,
		location: "Minneapolis, MN",
		lastActivity: "2025-02-01",
		albumCovers: ["/album.png", "/album2.png"],
	},
	{
		id: "2",
		name: "Frank Ocean, SZA, Jorja Smith",
		memberCount: 20,
		location: "Los Angeles, CA",
		lastActivity: "2025-02-07",
		albumCovers: ["/album.png", "/album2.png"],
	},
	// {
	// 	id: "3",
	// 	name: "Frank Ocean, SZA, Jorja Smith",
	// 	memberCount: 30,
	// 	location: "Chicago, IL",
	// 	lastActivity: "2025-02-08",
	// 	albumCovers: ["/album.png", "/album2.png"],
	// },
];
export default function Communities() {
	return (
		<div className="flex flex-col gap-16 max-w-4xl mx-auto py-16">
			<RippleSection
				heading="Recently active ripples"
				ripples={sampleRipples}
			/>
			<RippleSection heading="Ripples you might like" ripples={sampleRipples} />
		</div>
	);
}
