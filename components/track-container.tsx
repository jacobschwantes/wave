"use client";
import Interface from "@/components/Interface";
import Scene from "@/components/Scene";
import { TrackProvider, useTrackContext } from "@/context/track-context";
import { Track } from "@/types/track";
import { ScrollControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import TrackView from "./track-view";
import { AnimatePresence, motion } from "framer-motion";
import ConcertOrganizer from "@/components/ConcertOrganizer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Button } from "./ui/button";
import Chat from "./chat";

export default function TrackContainer({
  tracks,
  rippleId,
}: {
  tracks: Track[];
  rippleId: string;
}) {

	return (
		<TrackProvider>
          <TabContainer tracks={tracks} rippleId={rippleId} />
		</TrackProvider>
	);
}

// new component to use context safely
function TabContainer({
  tracks,
  rippleId,
}: {
  tracks: Track[];
  rippleId: string;
}) {
  const { setSelectedTrack } = useTrackContext();

  const handleTabChange = (value: string) => {
    setSelectedTrack(null);
  };

  return (
    <main className="h-[calc(100dvh-70px)] w-screen relative overflow-hidden">
      <Tabs
        defaultValue="tracks"
        className="w-full"
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

        <TabsContent value="community" className="h-full">
          <ConcertOrganizer />
        </TabsContent>

        <TabsContent value="chat" className="h-full">
          <Chat />
        </TabsContent>
      </Tabs>
    </main>
  );
}

const SceneContainer = ({ tracks }: { tracks: Track[] }) => {
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
