
import { BrowserWindow, ipcMain } from 'electron';
import { is } from '@electron-toolkit/utils'
import { createOverlayWindow, InfoPopupData } from './utility';
import { join } from 'path'
import { startSongPlayingCheck } from './spotifyMonitor';
import { registerHandler as registerTestButtonHandler } from './testCalls';
import { recommendNextSong } from '.';
import { rating } from './utility';


const showTestButton: boolean = true;
export let testButton: BrowserWindow;

const showOutputOverlay: boolean = true;
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

const segmentBarSize = {
  width: 600,
  height: 8,
}

const segmentBarWithPopupSize = {
  width: 600,
  height: 50,
}

let segmentBarStartY: number;


//#region Windows

export function createOverlay(): void {
  if (showTestButton) {
    testButton = createOverlayWindow(100, 46, 20, 20);
  }
  loginOverlay = createOverlayWindow(115, 46, '70%', '1%');
  songRateOverlay = createOverlayWindow(70, 35, '26%', '94%');
  if (showOutputOverlay) {
    outputOverlay = createOverlayWindow(300, 200, '80%', '70%');
  }
  setPlaylistOverlay = createOverlayWindow(
    setPlaylistButtonSize.width, 
    setPlaylistButtonSize.height, 
    '23%', '1%'
  );
  segmentBarOverlay = createOverlayWindow(
    segmentBarSize.width, 
    segmentBarSize.height, 
    'center', '86%'
  );

  if (is.dev) {
    if (showTestButton) {
      testButton.loadURL(`${devURL}/testButton.html`);
    }
    loginOverlay.loadURL(`${devURL}/login.html`);
    songRateOverlay.loadURL(`${devURL}/songRate.html`);
    if (showOutputOverlay) {
      outputOverlay.loadURL(`${devURL}/outputWindow.html`);
    }
    setPlaylistOverlay.loadURL(`${devURL}/setPlaylist.html`);
    segmentBarOverlay.loadURL(`${devURL}/segmentBar.html`);
  } else {
    if (showTestButton) {
      testButton.loadFile(join(__dirname, "../renderer/testButton.html"));
    }
    loginOverlay.loadFile(join(__dirname, "../renderer/login.html"));
    songRateOverlay.loadFile(join(__dirname, "../renderer/songRate.html"));
    if (showOutputOverlay) {
      outputOverlay.loadFile(join(__dirname, "../renderer/outputWindow.html"));
    }
    setPlaylistOverlay.loadFile(join(__dirname, "../renderer/setPlaylist.html"));
    segmentBarOverlay.loadFile(join(__dirname, "../renderer/segmentBar.html"));
  }

  if (showOutputOverlay) allNonPopups.push(loginOverlay);
  allNonPopups.push(songRateOverlay);
  allNonPopups.push(outputOverlay);
  allNonPopups.push(setPlaylistOverlay);
  allNonPopups.push(segmentBarOverlay);

  setPlaylistOverlay.on('ready-to-show', () => {
    // those processes are quit when this app is quit
    //startSpotifyMonitor(showAllWindows, hideAllWindows);
    startSongPlayingCheck(
      () => setSongPlayingState(true), 
      () => setSongPlayingState(false), 
      recommendNextSong,
      setSongRating,
      setSegmentRating
    );
    segmentBarStartY = segmentBarOverlay.getPosition()[1];
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

if (showTestButton) {
  registerTestButtonHandler();
}



export function showOutput(msg: string): void {
  if (showOutputOverlay) outputOverlay.webContents.send('display-output', msg);
}


/**
 * Lets the windows know wether the user is logged in.
 * Currently, this means that our app has the users access token in the RAM.
 */
export function setLoggedInState(state: boolean): void {
  loginOverlay.webContents.send('set-sign-in-state', state);
  setPlaylistOverlay.webContents.send('set-sign-in-state', state);
  segmentBarOverlay.webContents.send('set-sign-in-state', state);
  songRateOverlay.webContents.send('set-sign-in-state', state);
}

/**
 * Lets the windows responsible for rating know wether there is currently a song
 * playing that is part of a managed playlist.
 */
export function setSongPlayingState(state: boolean): void {
  segmentBarOverlay.webContents.send('set-song-playing', state);
  songRateOverlay.webContents.send('set-song-playing', state);
}

export function setSongRating(rating: rating): void {
  songRateOverlay.webContents.send('set-song-rating', rating);
}

export function setSegmentRating(index: number, rating: rating): void {
  segmentBarOverlay.webContents.send('set-segment-rating', index, rating);
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
  if (showOutputOverlay) outputOverlay.webContents.send('display-output', errorMessage);
});


// Called when the Set Playlist input popup should be shown or hidden
// the popup itself is a UI element that is enabled or disabled in the renderer
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

// Called when the Segment Rating popup should be shown or hidden
ipcMain.on('resize-segment-window', (_, withPopup: boolean) => {
  segmentBarOverlay.setResizable(true);
  const pos = segmentBarOverlay.getPosition();

  if (withPopup) {
    segmentBarOverlay.setSize(segmentBarWithPopupSize.width, segmentBarWithPopupSize.height);
    const yDelta = segmentBarWithPopupSize.height - segmentBarSize.height;
    segmentBarOverlay.setPosition(pos[0], segmentBarStartY - yDelta);
    //console.log("Resizing to ", segmentBarWithPopupSize);
  } else {
    segmentBarOverlay.setSize(segmentBarSize.width, segmentBarSize.height);
    segmentBarOverlay.setPosition(pos[0], segmentBarStartY);
    //console.log("Resizing to ", segmentBarSize);
  }

  segmentBarOverlay.setResizable(false);
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

export function showInfoPopupAbove(window: BrowserWindow, header: string, body: string, isError: boolean) : BrowserWindow {
  const [windowX, windowY] = window.getPosition();

  const popupWidth = 300;
  const popupHeight = 300; // arbitrary
  const offset = 16;

  const xPos = windowX + popupWidth / 2;
  const yPos = windowY - popupHeight - offset;
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