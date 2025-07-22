// src/main/spotifyMonitor.ts
import { isCurrentSongInManagedPlaylist } from './spotifyAPI';

type Callback = () => void;

let lastState = false;
let interval: NodeJS.Timeout | null = null;
let onFocus: Callback = () => {};
let onBlur: Callback = () => {};


let lastPlayingState = false;
let songInterval: NodeJS.Timeout | null = null;
let onPlaying: Callback = () => {};
let onNotPlaying: Callback = () => {};


export function startSongPlayingCheck(
  onSongPlaying: Callback,
  onNoSongPlaying: Callback,
  pollInterval: number = 5000
): void {
  onPlaying = onSongPlaying;
  onNotPlaying = onNoSongPlaying;

  songInterval = setInterval(async () => {
    try {
      const isPlaying = await isCurrentSongInManagedPlaylist();
      //console.log("Is a song from the managed playlist playing? ", isPlaying);

      if (isPlaying !== lastPlayingState) {
        lastPlayingState = isPlaying;
        isPlaying ? onPlaying() : onNotPlaying();
      }
    } catch (err) {
      console.error("Failed to check if current playing song is in the managed playlist:", err);
    }
  }, pollInterval);
}

export function startSpotifyMonitor(
  onSpotifyFocus: Callback,
  onSpotifyBlur: Callback,
  pollInterval: number = 1000
) {
  onFocus = onSpotifyFocus;
  onBlur = onSpotifyBlur;


}

export function stopSpotifyMonitor() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}