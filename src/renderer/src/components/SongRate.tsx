import '../assets/main.css'

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

function SongRate(): React.JSX.Element {

    const handlePlus = async () => {
        const allowed = await window.backend.isSongRatingAllowed();
        if (!allowed)
            return;
    
        window.backend.rateCurrentSong(1);
    };

    const handleMinus = async () => {
        const allowed = await window.backend.isSongRatingAllowed();
        if (!allowed)
            return;

        window.backend.rateCurrentSong(-1);
    };

    return (
        <div className="song-rate-div">
            <button className="song-rate-plus" onClick={handlePlus}>+</button>
            <button className="song-rate-minus" onClick={handleMinus}>-</button>
        </div>
    );
}

createRoot(document.getElementById('overlay-song-rate')!).render(
  <StrictMode>
    <SongRate />
  </StrictMode>
)
