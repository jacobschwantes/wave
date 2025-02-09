"use client";
import Interface from "@/components/Interface";
import Scene from "@/components/Scene";
import { TrackProvider, useTrackContext } from "@/context/track-context";
import { Track } from "@/types/track";
import { ScrollControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import TrackView from "./track-view";
import { AnimatePresence, motion } from "motion/react";

export default function TopTracks({
	tracks,
	setSelectedTrackId,
	rippleId,
}: {
	tracks: Track[];
	setSelectedTrackId: (id: string) => void;
	rippleId: string;
}) {
	return (
		<TrackProvider>
			<main className="h-[calc(100dvh-70px)] w-screen relative overflow-hidden">
				<Interface itemsCount={tracks.length} rippleId={rippleId} />
				<SceneContainer
					tracks={tracks}
					setSelectedTrackId={setSelectedTrackId}
				/>
			</main>
		</TrackProvider>
	);
}

const SceneContainer = ({
	tracks,
	setSelectedTrackId,
}: {
	tracks: Track[];
	setSelectedTrackId: (id: string) => void;
}) => {
	const { selectedTrack, setSelectedTrack } = useTrackContext();
	const [key, setKey] = useState(0);
	// if (selectedTrack) {
	// 	console.log(selectedTrack.album.images[0].url);
	// 	return (
	// 		<div className="absolute inset-0">
	// 			<motion.div
	// 				style={{
	// 					x: 0,
	// 					y: 0,
	// 					// width: "100%",
	// 					// height: "100%",
	// 				}}
	// 				layoutId={selectedTrack.id}
	// 				onClick={() => setSelectedTrack(null)}
	// 			>
	// 				<Image
	// 					src={selectedTrack.album.images[0].url}
	// 					alt="Reset"
	// 					width={400}
	// 					height={400}
	// 					className="object-cover"
	// 				/>
	// 			</motion.div>
	// 		</div>
	// 	);
	// }'

	useEffect(() => {
		if (selectedTrack) {
			setSelectedTrackId(selectedTrack.id);
		}
	}, [selectedTrack]);

	return (
		<div key={key} className="absolute inset-0">
			<AnimatePresence>
				{selectedTrack && (
					<motion.button
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.8 }}
						onClick={() => {
							setSelectedTrack(null);
							setKey(key + 1);
						}}
						className="absolute left-[12%] top-[40%] p-2 rounded-full bg-neutral-900 hover:scale-105 transition-transform duration-200 z-50"
					>
						<img src="/icons/return-arrow.svg" className="w-4 h-4" />
					</motion.button>
				)}
			</AnimatePresence>
			{selectedTrack && <TrackView />}

			<Canvas>
				<Suspense fallback={null}>
					<ScrollControls
						distance={selectedTrack ? 0 : undefined}
						eps={0.001}
						horizontal={false}
						pages={tracks.length / 2.5}
						damping={0.01}
					>
						<Scene trackList={tracks} />
					</ScrollControls>
				</Suspense>
			</Canvas>
		</div>
	);
};
