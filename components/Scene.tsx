"use client";

import useDimensions from "@/hooks/useDimensions";
import { Track } from "@/types/track";
import {
	AdaptiveDpr,
	AdaptiveEvents,
	OrthographicCamera,
	useTexture,
} from "@react-three/drei";
import { useMotionValueEvent } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import CustomControls from "@/components/CustomControls";
import TrackListItem from "@/components/TrackListItem";
import { useTrackContext } from "@/context/track-context";
import { useFrame } from "@react-three/fiber";

interface SceneProps {
	trackList: Track[];
}

const Scene: React.FC<SceneProps> = ({ trackList }) => {
	// REFS
	const cameraRef = useRef<THREE.OrthographicCamera>(null);

	// POSITION INITIALE DE LA CAMERA
	const [cameraX, cameraY, cameraZ] = [3, 3.75, 3];

	// ALPHAMAP TEXTURE POUR LES TRACKS
	const alphaMapTexture = useTexture("/textures/alphaMap.webp");

	// WINDOW DIMENSIONS
	const { width } = useDimensions();
	const [innerWidth, setInnerWidth] = useState<number>(width.get());

	useMotionValueEvent(width, "change", (latest) => {
		setInnerWidth(latest);
	});
  
  
  const { selectedTrack, setSelectedTrack } = useTrackContext();

	useFrame(() => {
		if (selectedTrack && cameraRef.current) {
			const trackIndex = trackList.findIndex(
				(track) => track.id === selectedTrack.id
			);
			cameraRef.current.position.lerp(
				new THREE.Vector3(1.5, 0, (trackIndex * 0.5) + 4),
				0.1
			);
			cameraRef.current.rotation.x = THREE.MathUtils.lerp(
				cameraRef.current.rotation.x,
				0,
				0.06
			);
			cameraRef.current.rotation.y = THREE.MathUtils.lerp(
				cameraRef.current.rotation.y,
				0,
				0.06
			);
		}
	});
  
  
	// RESET THE CAMERA POSITION WHEN RETURNING TO THE GLOBAL VIEW
	useEffect(() => {
		if (!selectedTrack && cameraRef.current) {
			cameraRef.current.position.x = cameraX;
			cameraRef.current.position.y = cameraY;
			cameraRef.current.position.z = cameraZ;
			cameraRef.current.rotation.x = Math.atan(-1 / Math.sqrt(2));
			cameraRef.current.rotation.y = Math.PI / 5;
		}
	}, [selectedTrack, cameraX, cameraY, cameraZ]);


	return (
		<>
			{/* PERFORMANCES */}
			<AdaptiveDpr pixelated />
			<AdaptiveEvents />

			<OrthographicCamera
				ref={cameraRef}
				makeDefault
				// zoom={275}
				zoom={innerWidth < 768 ? 200 : innerWidth > 1500 ? 300 : 275}
				near={2}
				far={100}
				position={[cameraX, cameraY, cameraZ]}
				rotation-order="YXZ"
				rotation-y={Math.PI / 4}
				rotation-x={Math.atan(-1 / Math.sqrt(2))}
			/>

			<group>
				{/* TRACKS */}
				{trackList.map((track, index) => {
					return (
						<TrackListItem
							key={track.id}
							track={track}
							index={index}
							alphaMapTexture={alphaMapTexture}
						/>
					);
				})}
			</group>

			<CustomControls cameraRef={cameraRef} itemsCount={trackList.length} />
		</>
	);
};

export default Scene;
