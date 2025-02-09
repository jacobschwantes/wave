"use client";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";

interface Concert {
  id: string;
  artist: {
    name: string;
    image: string;
  };
  date: string;
  venue: string;
  attendeeCount: number;
  isGoing?: boolean;
}

// initial mock data without images
const initialConcerts: Concert[] = [
  {
    id: "1",
    artist: {
      name: "Arctic Monkeys",
      image: "/placeholder-artist.jpg",
    },
    date: "2024-04-15T20:00:00",
    venue: "Madison Square Garden",
    attendeeCount: 342,
  },
  {
    id: "2",
    artist: {
      name: "The Strokes",
      image: "/placeholder-artist.jpg",
    },
    date: "2024-05-20T19:30:00",
    venue: "O2 Arena",
    attendeeCount: 256,
  },
  {
    id: "3",
    artist: {
      name: "Tame Impala",
      image: "/placeholder-artist.jpg",
    },
    date: "2024-06-10T21:00:00",
    venue: "Red Rocks Amphitheatre",
    attendeeCount: 178,
  }
];

export default function ConcertOrganizer() {
  const [concerts, setConcerts] = useState<Concert[]>(initialConcerts);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchArtistImages() {
      try {
        // fetch images sequentially instead of in parallel
        const updatedConcerts = [...concerts];
        
        for (let i = 0; i < concerts.length; i++) {
          try {
            const response = await fetch(
              `/api/spotify/artist-image?name=${encodeURIComponent(concerts[i].artist.name)}`
            );
            const data = await response.json();
            
            if (data.imageUrl) {
              updatedConcerts[i] = {
                ...updatedConcerts[i],
                artist: {
                  ...updatedConcerts[i].artist,
                  image: data.imageUrl
                }
              };
              // update state after each successful fetch
              setConcerts([...updatedConcerts]);
            }
          } catch (error) {
            console.error(`Failed to fetch image for ${concerts[i].artist.name}:`, error);
            // continue with next artist if one fails
            continue;
          }
        }
      } catch (error) {
        console.error('Failed to fetch artist images:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchArtistImages();
  }, []);

  const toggleAttendance = (concertId: string) => {
    setConcerts(prev =>
      prev.map(concert => {
        if (concert.id === concertId) {
          return {
            ...concert,
            attendeeCount: concert.isGoing ? concert.attendeeCount - 1 : concert.attendeeCount + 1,
            isGoing: !concert.isGoing,
          };
        }
        return concert;
      })
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Upcoming Concerts</h2>
      <div className="space-y-4">
        {concerts.map(concert => (
          <div 
            key={concert.id}
            className="bg-neutral-200 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                {isLoading ? (
                  <div className="absolute inset-0 bg-neutral-800 animate-pulse rounded-full" />
                ) : (
                  <img
                    src={concert.artist.image}
                    alt={concert.artist.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{concert.artist.name}</h3>
                <p className="text-neutral-400 text-sm">
                  {new Date(concert.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-neutral-400 text-sm">{concert.venue}</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <Button
                onClick={() => toggleAttendance(concert.id)}
                variant={concert.isGoing ? "secondary" : "default"}
                className="min-w-[100px]"
              >
                {concert.isGoing ? 'Going!' : 'Attend'}
              </Button>
              <p className="text-sm text-neutral-400">
                {concert.attendeeCount} {concert.attendeeCount === 1 ? 'person' : 'people'} going
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 