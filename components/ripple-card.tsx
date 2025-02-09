"use client";

import { motion } from "framer-motion";
import { Card } from "./ui/card";
import { AlbumCoverMarquee } from "./marquee";
import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Ripple } from "@/types/ripple";

export function RippleCard({ ripple }: { ripple: Ripple }) {
	const [isHovered, setIsHovered] = useState(false);
	return (
		<motion.div
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
			className="flex flex-col gap-1 items-end"
		>
			<Link href={`/ripple/${ripple.id}`}>
				<Card className="aspect-video w-full bg-muted py-4 flex flex-col h-full gap-2">
					<div className="h-16">
						<AlbumCoverMarquee
							covers={ripple.albumCovers}
							animate={isHovered}
						/>
					</div>
					<div className="flex-1 flex flex-col justify-between px-4">
						<h3 className="text-3xl font-thin">{ripple.name}</h3>
						<div className="flex justify-between mt-auto">
							<p className="text-sm text-muted-foreground">
								{ripple.memberCount} members
							</p>
							<p className="text-sm text-muted-foreground">{ripple.location}</p>
						</div>
					</div>
				</Card>
			</Link>
			<p className="text-sm text-muted-foreground underline">
				Active {formatDate(ripple.lastActivity)}
			</p>
		</motion.div>
	);
}
