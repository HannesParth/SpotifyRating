import { useEffect, useState } from "react";
import '../assets/main.css'

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';



function OutputWindow(): React.JSX.Element {
  const [output, setOutput] = useState<string[]>([]);

  useEffect(() => {
    window.electron.ipcRenderer.on('display-output', (_, msg: string) => {
      setOutput(prev => [...prev, msg]);
    });

    return () => {
      window.electron.ipcRenderer.removeAllListeners('display-output');
    };
  }, []);


  return (
    <div style={{
      maxHeight: '100%',
      overflowY: 'auto',
      padding: '10px',
    }}>
      <h5>Output</h5>
      {output.map((line, index) => (
        <p key={index} style={{ color: 'white', margin: 0 }}>{line}</p>
      ))}
    </div>
  );
}


createRoot(document.getElementById('overlay-output')!).render(
  <StrictMode>
    <OutputWindow />
  </StrictMode>
)
