import { useTrackContext } from "@/context/track-context";
import { AnimatePresence, motion } from "framer-motion";

const HoveredTrack = () => {
  // CONTEXT TRACKS
  const { hoveredTrack } = useTrackContext();

  return (
    <AnimatePresence mode="sync">
      {hoveredTrack && (
        <div
          key={hoveredTrack.id}
          className="absolute bottom-28 right-16 flex flex-col items-end z-50 max-sm:hidden"
        >
          <motion.h3
            key={hoveredTrack.id + hoveredTrack.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="text-xl font-semibold max-md:text-lg"
          >
            {hoveredTrack.title}
          </motion.h3>
          <motion.p
            key={hoveredTrack.id + hoveredTrack.artist}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, delay: 0.05, ease: "easeInOut" }}
            className="text-[#9C9A9A] max-md:text-sm"
          >
            {`${hoveredTrack.artist} • ${
              hoveredTrack.album
            }`}
          </motion.p>
        </div>
      )}
    </AnimatePresence>
  );
};

export default HoveredTrack;
