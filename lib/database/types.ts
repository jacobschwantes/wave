import { DateTime } from "next-auth/providers/kakao";
import { ClientSong } from "../spotify/SpotifyClient";

// auth types
export type SpotifyTokens = {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
};

// database entity types
export type User = {
    id: number;
    name: string;
    email: string;
    image: string;
};

export type Genre = {
    id: number;
    name: string;
    x: number;
    y: number;
    created_at: DateTime;
    updated_at: DateTime;
};

export type Artist = {
    id: number;
    genres: Genre[];
    spotify_id: string;
    name: string;
    created_at: DateTime;
    updated_at: DateTime;
};

export type Song = {
    id: number;
    genres: Genre[];
    spotify_id: string;
    ripple_id: number;
    created_at: DateTime;
    updated_at: DateTime;
};

// visualization types
export type Coordinate = {
    x: number;
    y: number;
};

export type Cluster = {
    id: number;
    x: number;
    y: number;
    radius: number;
    genres: Genre[];
    user_id: number;
};

export type Ripple = {
    id: number;
    x: number;
    y: number;
    radius: number;
    songs: ClientSong[];
    clusters: Cluster[];
    artists: Artist[];
};

export type GenreCoordinate = {
    genre: string;
    x: number;
    y: number;
};

// social types
export type Comment = {
    id: number;
    text: string;
    created_at: string;
    updated_at: string;
    user: User;
}; 