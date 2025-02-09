"use client";

import { motion } from "framer-motion";
import { Card } from "./ui/card";
import { AlbumCoverMarquee } from "./marquee";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Ripple } from "@/types/ripple";
import { ClientSong } from "@/lib/spotify/SpotifyClient";

export function RippleCard({ songs, rippleId }: { rippleId: number, songs: ClientSong[]}) {
	const [isHovered, setIsHovered] = useState(false);
	const [albumCovers, setAlbumCovers] = useState<string[]>([]);
	const [artists, setArtists] = useState<string[]>([]);

	useEffect(() => {
		const _albumCovers = songs.map((song) => song.albumCover);
		setAlbumCovers(_albumCovers.slice(0,3));
		const _artists = songs.map((song) => song.artist);
		setArtists(_artists.slice(0, 3));
	}, [])
	return (
		<motion.div
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
			className="flex flex-col gap-1 items-end"
		>
			<Link className="w-full aspect-video" href={`/ripple/${rippleId}`}>
				<Card className="h-full w-full overflow-hidden py-4 flex flex-col h-full gap-2 bg-gradient-to-br from-gray-100 to-gray-200">
					<div className="h-16">
						<AlbumCoverMarquee
							covers={albumCovers}
							animate={isHovered}
						/>
					</div>
					<div className="flex-1 flex flex-col justify-between px-4">
						<h3 className="text-3xl font-thin">{artists.join(", ")}</h3>
						<div className="flex justify-between mt-auto">
							<p className="text-sm text-muted-foreground">
								{12} members
							</p>
							<p className="text-sm text-muted-foreground">{"Minneapolis"}</p>
						</div>
					</div>
				</Card>
			</Link>
			<p className="text-sm text-muted-foreground underline">
				Active {formatDate(new Date().toString())}
			</p>
		</motion.div>
	);
}
