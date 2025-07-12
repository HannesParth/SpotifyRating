
import { BrowserWindow, ipcMain } from 'electron';
import { is } from '@electron-toolkit/utils'
import { createOverlayWindow, InfoPopupData } from './utility';
import { join } from 'path'
import { startSpotifyMonitor } from './spotifyMonitor';


export let outputOverlay: BrowserWindow;
export let loginOverlay: BrowserWindow;
export let songRateOverlay: BrowserWindow;
export let setPlaylistOverlay: BrowserWindow;
export let segmentBarOverlay: BrowserWindow;
export let infoPopupOverlays: BrowserWindow[] = [];

const allNonPopups: BrowserWindow[] = [];

const devURL = "http://localhost:5173";

const setPlaylistButtonSize = {
  width: 140,
  height: 45,
}

const setPlaylistWithInputSize = {
  width: 200,
  height: 130,
}


//#region Windows

export function createOverlay(): void {
  loginOverlay = createOverlayWindow(115, 46, '70%', '1%');
  songRateOverlay = createOverlayWindow(80, 35, '26%', '94%');
  outputOverlay = createOverlayWindow(300, 200, '80%', '70%');
  setPlaylistOverlay = createOverlayWindow(
    setPlaylistButtonSize.width, 
    setPlaylistButtonSize.height, 
    '23%', '1%'
  );
  segmentBarOverlay = createOverlayWindow(600, 8, 'center', '98.5%');

  if (is.dev) {
    loginOverlay.loadURL(`${devURL}/login.html`);
    songRateOverlay.loadURL(`${devURL}/songRate.html`);
    outputOverlay.loadURL(`${devURL}/outputWindow.html`);
    setPlaylistOverlay.loadURL(`${devURL}/setPlaylist.html`);
    segmentBarOverlay.loadURL(`${devURL}/segmentBar.html`);
  } else {
    loginOverlay.loadFile(join(__dirname, "../renderer/login.html"));
    songRateOverlay.loadFile(join(__dirname, "../renderer/songRate.html"));
    songRateOverlay.loadFile(join(__dirname, "../renderer/outputWindow.html"));
    setPlaylistOverlay.loadFile(join(__dirname, "../renderer/setPlaylist.html"));
    segmentBarOverlay.loadFile(join(__dirname, "../renderer/segmentBar.html"));
  }

  allNonPopups.push(loginOverlay);
  allNonPopups.push(songRateOverlay);
  allNonPopups.push(outputOverlay);
  allNonPopups.push(setPlaylistOverlay);
  allNonPopups.push(segmentBarOverlay);

  setPlaylistOverlay.on('ready-to-show', () => {
    // those processes are quit when spotify is quit
    startSpotifyMonitor(showAllWindows, hideAllWindows);
  });

  console.log("Created overlay windows");
}


function hideAllWindows(): void {
  allNonPopups.forEach(win => win.hide());
  infoPopupOverlays.forEach(win => win.hide());
  console.log("Hiding windows");
}

function showAllWindows(): void {
  allNonPopups.forEach(win => win.show());
  infoPopupOverlays.forEach(win => win.show());
  console.log("Showing windows");
}

//#endregion


export function showOutput(msg: string): void {
  outputOverlay.webContents.send('display-output', msg);
}

export function setLoggedInState(state: boolean): void {
  loginOverlay.webContents.send('set-sign-in-state', state);
  setPlaylistOverlay.webContents.send('set-sign-in-state', state);
}

/**
 * Example call: <br>
 * setSegments([
    { from: 0, to: 0.15},
    { from: 0.15, to: 0.38 },
    { from: 0.38, to: 0.74 },
    { from: 0.74, to: 1 },
  ]);
 */
export function setSegments(segments: { from: number, to: number }[]): void {
  segmentBarOverlay.webContents.send('set-segments', segments);
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



//#region Info Popup Window

// Called with window.backend.showInfoPopup from the renderer
ipcMain.handle('show-info-popup', (_, data: InfoPopupData) => {
  showInfoPopup(data);
});

export function showInfoPopup(data: InfoPopupData): BrowserWindow {
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

  return popup;
}

export function showInfoPopupBelow(window: BrowserWindow, header: string, body: string, isError: boolean) : BrowserWindow {
  const [windowX, windowY] = window.getPosition();
  const [_windowWidth, windowHeight] = window.getSize();

  const popupWidth = 300;
  const offset = 16;

  const xPos = windowX + popupWidth / 2;
  const yPos = windowY + windowHeight + offset;
  return showInfoPopup({
    x: xPos,
    y: yPos,
    header: header,
    body: body,
    isError: isError
  });
}



ipcMain.handle('hide-info-popup', (_, id: number) => {
  hideInfoPopup(id);
});

export function hideInfoPopup(id: number): void {
  const popup = infoPopupOverlays.find(overlay => overlay.id === id)
  if (!popup) {
    console.error("Tried to hide info popup when it was not set.");
    return;
  }

  infoPopupOverlays = infoPopupOverlays.filter(overlay => overlay !== popup);
  popup.close();
}

export function hideAllInfoPopups(): void {
  for (const popup of infoPopupOverlays) {
    popup.close();
  }
  infoPopupOverlays = [];
}

export function hideTopInfoPopup(): void {
  const popup = infoPopupOverlays.pop();

  if (!popup) {
    return;
  }
  popup.close();
}



ipcMain.handle('resize-info-popup', (_, width: number, height: number, id: number) => {
  const popup = infoPopupOverlays.find(overlay => overlay.id === id)
  if (!popup) {
    console.error("Tried to set info popup size but could not find it by id.");
    return;
  }

  popup.setResizable(true);
  popup.setSize(width, height);
  popup.setResizable(false);
});

//#endregion