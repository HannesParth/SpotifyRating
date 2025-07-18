import '../assets/main.css'

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function SongRate(): React.JSX.Element {
  // --- Checks: Signed in and Song Playing ---
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [songPlaying, setSongPlaying] = useState<boolean | null>(null);

  useEffect(() => {
    window.electron.ipcRenderer.on('set-sign-in-state', (_: any, state: boolean) => {
      setSignedIn(state);
    });
  }, []);

  useEffect(() => {
    window.electron.ipcRenderer.on('set-song-playing', (_: any, state: boolean) => {
      setSongPlaying(state);
    });
  }, []);


  // --- Button Calls ---
  const handlePlus = async () => {
    window.backend.rateCurrentSong(1);
  };

  const handleMinus = async () => {
    window.backend.rateCurrentSong(-1);
  };

  return (
    <div className="song-rate-div">
      <button 
        className="song-rate-plus" 
        onClick={handlePlus} 
        disabled={!signedIn || !songPlaying}
      >
        +
      </button>
      <button 
        className="song-rate-minus" 
        onClick={handleMinus} 
        disabled={!signedIn || !songPlaying}
      >
        -
      </button>
    </div>
  );
}

createRoot(document.getElementById('overlay-song-rate')!).render(
  <StrictMode>
    <SongRate />
  </StrictMode>
)
