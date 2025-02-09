"use client";

import { motion } from "motion/react";

interface AlbumCoverMarqueeProps {
	covers: string[]; // Array of image URLs
	speed?: number; // Optional speed parameter (pixels per second)
	animate?: boolean; // Add new prop
}

export function AlbumCoverMarquee({
	covers,
	speed = 50,
	animate = true, // Default to true
}: AlbumCoverMarqueeProps) {
	return (
		<div className="overflow-hidden whitespace-nowrap h-full">
			<motion.div
				className="inline-flex h-full"
				initial={{ x: "0%" }}
				animate={
					animate
						? {
								x: "-50%",
								transition: {
									duration: (covers.length * 200) / speed,
									ease: "linear",
									repeat: Infinity,
								},
						  }
						: undefined
				}
			>
				{/* First set of images */}
				{covers.map((cover, index) => (
					<img
						key={`cover-${index}`}
						src={cover}
						alt={`Album cover ${index + 1}`}
						className="h-full aspect-square object-cover mx-2"
					/>
				))}
				{/* Duplicate set for seamless loop */}
				{covers.map((cover, index) => (
					<img
						key={`cover-duplicate-${index}`}
						src={cover}
						alt={`Album cover ${index + 1}`}
						className="h-full aspect-square object-cover mx-2"
					/>
				))}

				{covers.map((cover, index) => (
					<img
						key={`cover-duplicate-${index}`}
						src={cover}
						alt={`Album cover ${index + 1}`}
						className="h-full aspect-square object-cover mx-2"
					/>
				))}
			</motion.div>
		</div>
	);
}
