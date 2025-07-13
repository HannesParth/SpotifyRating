// src/main/spotifyMonitor.ts
import activeWindow from 'active-win';

type Callback = () => void;

let lastState = false;
let interval: NodeJS.Timeout | null = null;
let onFocus: Callback = () => {};
let onBlur: Callback = () => {};


export function startSpotifyMonitor(
  onSpotifyFocus: Callback,
  onSpotifyBlur: Callback,
  pollInterval: number = 1000
) {
  onFocus = onSpotifyFocus;
  onBlur = onSpotifyBlur;

  interval = setInterval(async () => {
    try {
      const active = await activeWindow();
      const windowName = active?.owner?.name?.toLowerCase();
      const isSpotify = windowName?.includes('spotify') ?? false;
      const isOwnApp = windowName?.includes('electron') ?? false;
      
      const isRelevant = isSpotify || isOwnApp;

      if (isRelevant !== lastState) {
        lastState = isRelevant;
        isRelevant ? onFocus() : onBlur();
      }
    } catch (err) {
      console.error("Failed to get active window:", err);
    }
  }, pollInterval);
}

export function stopSpotifyMonitor() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}