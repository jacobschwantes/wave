"use client";
import Interface from "@/components/Interface";
import Scene from "@/components/Scene";
import { TrackProvider, useTrackContext } from "@/context/track-context";
import { ScrollControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import TrackView from "./track-view";
import { AnimatePresence, motion } from "framer-motion";
import ConcertOrganizer from "@/components/ConcertOrganizer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import Chat from "./chat";
import { ClientSong } from "@/lib/spotify/SpotifyClient";
import NeonClient, { Comment } from "@/lib/database/NeonClient";

export default function RippleViewClient({
  tracks,
  rippleId,
  chats,
}: {
  tracks: ClientSong[];
  rippleId: string;
  chats: Comment[];
}) {

	return (
		<TrackProvider>
          <TabContainer tracks={tracks} rippleId={rippleId} chats={chats} />
		</TrackProvider>
	);
}

// new component to use context safely
function TabContainer({
  tracks,
  rippleId,
  chats,
}: {
  tracks: ClientSong[];
  rippleId: string;
  chats: Comment[];
}) {
  const { setSelectedTrack } = useTrackContext();

  const handleTabChange = (value: string) => {
    setSelectedTrack(null);
  };

  return (
    <main className="h-[calc(100dvh-70px)] w-screen relative overflow-hidden">
      <Tabs
        defaultValue="tracks"
        className="w-full h-full"
        onValueChange={handleTabChange}
      >
        <TabsList className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
          <TabsTrigger value="tracks">tracks</TabsTrigger>
          <TabsTrigger value="community">community</TabsTrigger>
          <TabsTrigger value="chat">chat</TabsTrigger>
        </TabsList>

        <TabsContent value="tracks" className="h-full">
          <Interface itemsCount={tracks.length} rippleId={rippleId} />
          <SceneContainer tracks={tracks} />
        </TabsContent>

        <TabsContent value="community" className="h-[calc(100dvh-150px)]">
          <ConcertOrganizer />
        </TabsContent>

        <TabsContent value="chat" className="h-[calc(100dvh-150px)]">
          <Chat chats={chats} rippleId={Number(rippleId)} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

const SceneContainer = ({ tracks }: { tracks: ClientSong[] }) => {
  const { selectedTrack, setSelectedTrack } = useTrackContext();
  const [key, setKey] = useState(0);

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
