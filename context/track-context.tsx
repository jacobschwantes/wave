// TrackContext.tsx
import { ClientSong } from "@/lib/spotify/SpotifyClient";
import { Track } from "@/types/track";
import React, { createContext, useContext, useState } from "react";

// Définissez la forme de votre contexte
interface TrackContextType {
	hoveredTrack: ClientSong | null;
	selectedTrack: ClientSong | null;
	setHoveredTrack: (track: ClientSong | null) => void;
	setSelectedTrack: (track: ClientSong | null) => void;
}

const TrackContext = createContext<TrackContextType | undefined>(undefined);

export const TrackProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [hoveredTrack, setHoveredTrack] = useState<ClientSong | null>(null);
	const [selectedTrack, setSelectedTrack] = useState<ClientSong | null>(null);

	return (
		<TrackContext.Provider
			value={{
				hoveredTrack,
				selectedTrack,
				setHoveredTrack,
				setSelectedTrack,
			}}
		>
			{children}
		</TrackContext.Provider>
	);
};

export const useTrackContext = () => {
	const context = useContext(TrackContext);
	if (!context) {
		throw new Error("useTrackContext must be used within a TrackProvider");
	}
	return context;
};
