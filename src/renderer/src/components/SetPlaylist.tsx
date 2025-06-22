import '../assets/main.css'

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';


function showOutput(msg: string): void {
    window.electron.ipcRenderer.send('display-output', msg);
}

function SetPlaylistButton(): React.JSX.Element {
    const [signedIn, setSignedIn] = useState<boolean | null>(null);
    const [showInput, setShowInput] = useState(false);
    const [playlistName, setPlaylistName] = useState("");

    useEffect(() => {
        const unsub = window.electron.ipcRenderer.on('set-sign-in-state', (_: any, state: boolean) => {
            setSignedIn(state);
            showOutput("Got signed in state: " + state);
        });
    
        return () => { unsub(); };
    }, []);

    useEffect(() => {
        window.electron.ipcRenderer.send('resize-set-playlist', showInput);
    }, [showInput]);

    const handleShowPopup = () => {
        setShowInput(!showInput);
    };

    const handleSubmitName = () => {
        setShowInput(false);
        
        if (playlistName === undefined || playlistName === "") {
            showOutput("Empty playlist name");
            return;
        }
        
        //send to main
        showOutput("Entered playlist: " + playlistName);
        window.electron.ipcRenderer.send('choose-managed-playlist', playlistName);
    }


    return (
        <div style={{background: 'none'}}>
            <button onClick={handleShowPopup} disabled={!signedIn} className="spotify-button">
                Set Playlist
            </button>

            {showInput && (
                <div className='set-playlist-input-div'>
                    <input
                        className='set-playlist-input'
                        type="text"
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                        placeholder="Spotify Playlist Name"
                    />
                    <button onClick={handleSubmitName} className='set-playlist-confirm-button'>
                        OK
                    </button>
                </div>
            )}
        </div>
    );
}


createRoot(document.getElementById('overlay-set-playlist')!).render(
  <StrictMode>
    <SetPlaylistButton />
  </StrictMode>
)
