// src/main/spotifyMonitor.ts
import { getCurrentSong, isTrackLastOfPlaylist } from './spotifyAPI';
import Storage from "./storage";
import { rating } from './utility';

type Callback = () => void;
type RatingCallback = (rating: rating) => void;

let lastPlayingState = false;
let songInterval: NodeJS.Timeout | null = null;
let onPlaying: Callback = () => {};
let onNotPlaying: Callback = () => {};
let onLast: Callback = () => {};
let onRated: RatingCallback;


export function startSongPlayingCheck(
  onSongPlaying: Callback,
  onNoSongPlaying: Callback,
  onLastSongPlaying: Callback,
  onSongRated: RatingCallback,
  pollInterval: number = 5000
): void {
  onPlaying = onSongPlaying;
  onNotPlaying = onNoSongPlaying;
  onLast = onLastSongPlaying;
  onRated = onSongRated;

  songInterval = setInterval(async () => {
    let songId: string | null = null;
    
    // --- check if a song from the managed playlist is chosen ---
    try {
      songId = await getCurrentSong();
      const isPlaying = !!songId;
      //console.log("Is a song from the managed playlist playing? ", isPlaying);

      if (isPlaying !== lastPlayingState) {
        lastPlayingState = isPlaying;
        isPlaying ? onPlaying() : onNotPlaying();
      }
    } catch (err) {
      console.error("Failed to check if current song is in the managed playlist:", err);
    }

    if (!songId) {
      onRated(0);
      return;
    }

    // --- check if the current song is rated ---
    const rating = Storage.getSongRating(songId);
    rating ? onRated(rating) : onRated(0);

    // --- check if the current song is the last one of the managed playlist ---
    try {
      const isLast = await isTrackLastOfPlaylist(songId);
      isLast ? onLast() : null;
    } catch (err) {
      console.error("Failed to check if current song is the last one of the playlist:", err);
    }
  }, pollInterval);
}


export function stopSongPlayingCheck() {
  if (songInterval) {
    clearInterval(songInterval);
    songInterval = null;
  }
}