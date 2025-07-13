import '../assets/main.css'

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';


function showOutput(msg: string): void {
    window.electron.ipcRenderer.send('display-output', msg);
}

function TestButton(): React.JSX.Element {

    const handleTest = async () => {
        try {
            await window.backend.callTest();
        }
        catch (err) {
            console.error("Error when trying to call test function: \n", err);
        }
    };

    return (
        <div style={{background: 'none'}}>
            <button onClick={handleTest} className="spotify-button">
                Test
            </button>
        </div>
    );
}


createRoot(document.getElementById('overlay-test')!).render(
  <StrictMode>
    <TestButton />
  </StrictMode>
)
