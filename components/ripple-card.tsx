"use client";

import { motion } from "framer-motion";
import { Card } from "./ui/card";
import { AlbumCoverMarquee } from "./marquee";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ClientSong } from "@/lib/spotify/SpotifyClient";
import { MapPin, User } from "lucide-react";

export function RippleCard({
  songs,
  rippleId,
}: {
  rippleId: number;
  songs: ClientSong[];
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [albumCovers, setAlbumCovers] = useState<string[]>([]);
  const [artists, setArtists] = useState<string[]>([]);

  useEffect(() => {
    const _albumCovers = songs.map((song) => song.albumCover);
    setAlbumCovers(_albumCovers.slice(0, 3));
    // get unique artists
    const uniqueArtists = [...new Set(songs.map((song) => song.artist))];
    setArtists(uniqueArtists.slice(0, 3));

    console.log(rippleId, songs);
  }, []);

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="flex flex-col gap-1 items-end"
    >
      <Link
        className="w-full aspect-video"
        href={{
          pathname: `/ripple/${rippleId}`,
        }}
      >
        <Card className="h-full w-full overflow-hidden py-4 flex flex-col gap-2 bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="h-16">
            {albumCovers.length > 1 ? (
              <AlbumCoverMarquee covers={albumCovers} animate={isHovered} />
            ) : (
              <div className="h-full flex justify-start px-4">
                <img 
                  src={albumCovers[0]} 
                  alt="album cover" 
                  className="h-full aspect-square object-cover"
                />
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between px-4">
            <h3 className="text-3xl font-thin">{artists.join(", ")}</h3>
            <div className="flex justify-between mt-auto">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{"Minneapolis, MN"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">4</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Active {formatDate(new Date().toString())}
              </p>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
