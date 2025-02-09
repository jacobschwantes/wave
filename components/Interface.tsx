import { motion } from "framer-motion";
import Image from "next/image";
import HoveredTrack from "@/components/HoveredTrack";
import Indicators from "@/components/Indicators";
import SelectedTrack from "@/components/SelectedTrack";

interface InterfaceProps {
	itemsCount: number;
}

const Interface: React.FC<InterfaceProps> = ({ itemsCount }) => {
	return (
		<>
			{/* SELECTED TRACK */}
			{/* <SelectedTrack /> */}

			{/* HOVERED TRACK */}
			<HoveredTrack />

			{/* INDICATORS */}
			<Indicators itemsCount={itemsCount} />

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
