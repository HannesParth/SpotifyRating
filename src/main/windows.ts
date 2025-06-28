
import { BrowserWindow, ipcMain } from 'electron';
import { is } from '@electron-toolkit/utils'
import { createOverlayWindow } from './utility';
import { join } from 'path'


export let outputOverlay: BrowserWindow;
export let loginOverlay: BrowserWindow;
export let songRateOverlay: BrowserWindow;
export let setPlaylistOverlay: BrowserWindow;

const devURL = "http://localhost:5173";

const setPlaylistButtonSize = {
  width: 140,
  height: 45,
}

const setPlaylistWithInputSize = {
  width: 200,
  height: 130,
}




export function createOverlay(): void {
  loginOverlay = createOverlayWindow(115, 46, '70%', '1%');
  songRateOverlay = createOverlayWindow(80, 30, '20%', '92%');
  outputOverlay = createOverlayWindow(300, 200, '80%', '70%');
  setPlaylistOverlay = createOverlayWindow(
    setPlaylistButtonSize.width, 
    setPlaylistButtonSize.height, 
    '23%', '1%'
  );

  if (is.dev) {
    loginOverlay.loadURL(`${devURL}/login.html`);
    songRateOverlay.loadURL(`${devURL}/songRate.html`);
    outputOverlay.loadURL(`${devURL}/outputWindow.html`);
    setPlaylistOverlay.loadURL(`${devURL}/setPlaylist.html`)
  } else {
    loginOverlay.loadFile(join(__dirname, "../renderer/login.html"));
    songRateOverlay.loadFile(join(__dirname, "../renderer/songRate.html"));
    songRateOverlay.loadFile(join(__dirname, "../renderer/outputWindow.html"));
    setPlaylistOverlay.loadFile(join(__dirname, "../renderer/setPlaylist.html"))
  }

  console.log("Created overlay windows");
}




export function showOutput(msg: string): void {
  outputOverlay.webContents.send('display-output', msg);
}

export function setLoggedInState(state: boolean): void {
  loginOverlay.webContents.send('set-sign-in-state', state);
  setPlaylistOverlay.webContents.send('set-sign-in-state', state);
}





// Bridge between any other windows and the output window
ipcMain.on('display-output', (_, errorMessage) => {
  outputOverlay.webContents.send('display-output', errorMessage);
});


// Called when the Set Playlist input popup should be shown or hidden
ipcMain.on('resize-set-playlist', (_, withInput: boolean) => {
  setPlaylistOverlay.setResizable(true);

  if (withInput) {
    setPlaylistOverlay.setSize(setPlaylistWithInputSize.width, setPlaylistWithInputSize.height);
    setPlaylistOverlay.setFocusable(true);
  } else {
    setPlaylistOverlay.setSize(setPlaylistButtonSize.width, setPlaylistButtonSize.height);
    setPlaylistOverlay.setFocusable(false);
  }

  setPlaylistOverlay.setResizable(false);
});