import '../assets/main.css'

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';


function showOutput(msg: string): void {
    window.electron.ipcRenderer.send('display-output', msg);
}

function InfoPopup(): React.JSX.Element {
    const [header, setHeader] = useState<string>("");
    const [body, setBody] = useState<string>("");
    const [electronId, setElectronId] = useState<number | null>(null)


    useEffect(() => {
        const unsub = window.electron.ipcRenderer.on('set-content', 
                (_: any, header: string, body: string, isError: boolean, electronId: number) => {
            setHeader(header);
            setBody(body);
            setElectronId(electronId);
            showOutput("Got Info data");


            const resizeToContent = () => {
                if (!electronId) {
                    showOutput("Tried to resize Info Popup but did not have ID to find it");
                    return;
                }
                const width = document.body.scrollWidth;
                const height = document.body.scrollHeight;

                window.backend.resizeInfoPopup(width, height, electronId);
            };

            // trigger after delay for content to render
            setTimeout(resizeToContent, 50);
        });
    
        return () => { unsub(); };
    }, []);


    const handleCloseWindow = () => {
        if (!electronId) {
            showOutput("Tried to close Info Popup but did not have ID to find it");
            return;
        }
        window.backend.hideInfoPopup(electronId);
    }

    return (
        <div style={{background: 'none'}}>
            <div>
                <h2 style={{ marginTop: 0 }}>{header}</h2>
                <p style={{ marginBottom: "2em", whiteSpace: "pre-wrap", maxWidth: "300px" }}>{body}</p>

                <button
                    onClick={handleCloseWindow}
                    className='spotify-button'>
                    OK
                </button>
            </div>
        </div>
    );
}


createRoot(document.getElementById('overlay-info-popup')!).render(
  <StrictMode>
    <InfoPopup />
  </StrictMode>
)
