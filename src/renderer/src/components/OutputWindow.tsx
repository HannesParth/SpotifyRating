import { useState } from "react";
import '../assets/main.css'

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';


function OutputWindow(): React.JSX.Element {
    // Todo: place all this into an extra, selectable window so we can use the console
    const [error, setError] = useState<string | null>(null)

    console.log("Called LoginButton");
    return (
        <div>
            <h6>Output</h6>
            {error && <p>{error}</p>}
        </div>
    );
}


createRoot(document.getElementById('overlay-output')!).render(
  <StrictMode>
    <OutputWindow />
  </StrictMode>
)
