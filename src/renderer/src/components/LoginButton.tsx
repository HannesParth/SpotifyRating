import { useState } from "react";
import '../assets/main.css'

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';


function LoginButton(): React.JSX.Element {
    const handleLogin = async () => {
        try {
            await window.spotifyAPI.auth();
        }
        catch (err) {
            console.error("Error when trying to call Spotify authentication: \n", err);
        }
    };

    console.log("Called LoginButton");
    return (
        <div style={{background: 'none'}}>
            <button onClick={handleLogin} className="spotify-button">Login</button>
        </div>
    );
}


createRoot(document.getElementById('overlay-button')!).render(
  <StrictMode>
    <LoginButton />
  </StrictMode>
)
