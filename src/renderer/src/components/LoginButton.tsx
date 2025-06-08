import '../assets/main.css'

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';


function showOutput(msg: string): void {
    window.electron.ipcRenderer.send('display-output', msg);
}

function LoginButton(): React.JSX.Element {
    const [signedIn, setSignedIn] = useState<boolean | null>(null);

    useEffect(() => {
        const unsub = window.electron.ipcRenderer.on('set-sign-in-state', (_: any, state: boolean) => {
            setSignedIn(state);
        });
    
        return () => { unsub(); };
      }, []);

    const handleLogin = async () => {
        try {
            await window.spotifyAPI.auth();
            showOutput("LoginButton: started auth flow");
        }
        catch (err) {
            console.error("Error when trying to call Spotify authentication: \n", err);
            showOutput("Spotify auth error: " + err);
        }
    };

    const handleLogout = async () => {
        // TODO
    };

    return (
        <div style={{background: 'none'}}>
            {signedIn === true ? (
                <button onClick={handleLogout} className="spotify-button">
                    Logout
                </button>
                ) : (
                <button onClick={handleLogin} className="spotify-button">
                    Login
                </button>
            )}
        </div>
    );
}


createRoot(document.getElementById('overlay-button')!).render(
  <StrictMode>
    <LoginButton />
  </StrictMode>
)
