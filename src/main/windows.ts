
import { BrowserWindow, ipcMain } from 'electron';
import { is } from '@electron-toolkit/utils'
import { createOverlayWindow, InfoPopupData } from './utility';
import { join } from 'path'


export let outputOverlay: BrowserWindow;
export let loginOverlay: BrowserWindow;
export let songRateOverlay: BrowserWindow;
export let setPlaylistOverlay: BrowserWindow;
export let infoPopupOverlays: BrowserWindow[] = [];

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


ipcMain.handle('show-info-popup', (_, data: InfoPopupData) => {
    const popup = createOverlayWindow(300, 30, data.x, data.y);

    if (is.dev) {
        popup.loadURL(`${devURL}/infoPopup.html`);
    } else {
        popup.loadFile(join(__dirname, "../renderer/infoPopup.html"));
    }

    popup.webContents.once('did-finish-load', () => {
        popup!.webContents.send('set-content', data.header, data.body, data.isError, popup.id);
    });
    infoPopupOverlays.push(popup);
    console.log("Created info popup");
});

ipcMain.handle('hide-info-popup', (_, id: number) => {
    const popup = infoPopupOverlays.find(overlay => overlay.id === id)
    if (!popup) {
        console.error("Tried to hide info popup when it was not set.");
        return;
    }

    infoPopupOverlays = infoPopupOverlays.filter(overlay => overlay !== popup);
    popup.close();
});

ipcMain.handle('resize-info-popup', (_, width: number, height: number, id: number) => {
        const popup = infoPopupOverlays.find(overlay => overlay.id === id)
    if (!popup) {
        console.error("Tried to set info popup size but could not find it by id.");
        return;
    }

    console.log(`Resizing from ${popup.getSize()} to ${width}, ${height}`);

    popup.setResizable(true);
    popup.setSize(width, height);
    popup.setResizable(false);
});