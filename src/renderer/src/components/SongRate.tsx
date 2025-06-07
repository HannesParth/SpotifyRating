import '../assets/main.css'

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

function SongRate(): React.JSX.Element {

    const handlePlus = async () => {
        console.log("Pressed plus");
    };

    const handleMinus = async () => {
        console.log("Pressed minus");
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
