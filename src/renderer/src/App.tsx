import electronLogo from "./assets/electron.svg";
import { useState } from "react";

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send("ping");

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Test the Spotify Login
      </div>

      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
    </>
  );
}

export default App;
