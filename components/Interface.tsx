import Image from "next/image";
import HoveredTrack from "@/components/HoveredTrack";
import Indicators from "@/components/Indicators";
import { sampleRipples } from "@/app/(dashboard)/home/page";
import { useTrackContext } from "@/context/track-context";
import { AnimatePresence, motion } from "motion/react";

interface InterfaceProps {
	itemsCount: number;
	rippleId: string;
}

const Interface: React.FC<InterfaceProps> = ({ itemsCount, rippleId }) => {
	const ripple = sampleRipples.find((r) => r.id === rippleId);
	const { selectedTrack } = useTrackContext();
	return (
		<>
			{/* SELECTED TRACK */}
			<AnimatePresence mode="wait">
				{!selectedTrack ? (
					<motion.div
						key={ripple?.id}
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -5 }}
						transition={{ ease: "easeOut", duration: 0.5 }}
						className="absolute top-2 left-8"
					>
						<h1 className=" text-2xl font-bold">{ripple?.name}</h1>
						<p className=" text-sm">{ripple?.location}</p>
						<p className=" text-sm">{ripple?.memberCount} members</p>
					</motion.div>
				) : (
					<motion.div
						key={selectedTrack?.id}
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -5 }}
						transition={{ ease: "easeOut", duration: 0.5 }}
						className="absolute top-2 left-8"
					>
						<h1 className=" text-2xl font-bold">{selectedTrack?.name}</h1>
						<p className=" text-sm">{selectedTrack?.artists[0].name}</p>
					</motion.div>
				)}
			</AnimatePresence>
			{/* <SelectedTrack /> */}

			{/* HOVERED TRACK */}
			{!selectedTrack && <HoveredTrack />}

			{/* INDICATORS */}
			{!selectedTrack && <Indicators itemsCount={itemsCount} />}

			{/* BLUR SHAPES */}
			<div className="pointer-events-none select-none">
				<Image
					src="/img/topright.svg"
					width={682}
					height={381}
					alt="Blurry shape on the top right corner"
					className="absolute top-0 right-0 z-10"
				/>
				<Image
					src="/img/bottomleft.svg"
					width={856}
					height={433}
					alt="Blurry shape on the bottom left corner"
					className="absolute bottom-0 left-0 z-10"
				/>
			</div>
		</>
	);
};

export default Interface;
