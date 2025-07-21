import { app, BrowserWindow, ipcMain } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'

import { startSpotifyAuthFlow, searchAllPlaylistsForName, getCurrentSong } from './spotifyAPI';
import { createOverlay, setLoggedInState } from './windows';
import { rating } from './utility';
import Storage from './storage';



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  //createWindow()
  createOverlay()

  // app.on('activate', function () {
  //   // On macOS it's common to re-create a window in the app when the
  //   // dock icon is clicked and there are no other windows open.
  //   if (BrowserWindow.getAllWindows().length === 0) createWindow()
  // })
})



// --- Authentication ---

// Called when the Login Button is pressed
ipcMain.handle('start-spotify-auth', () => {
  startSpotifyAuthFlow();
});

// Called when the Logout Button is pressed
ipcMain.handle('spotify-logout', () => {
  setLoggedInState(false);
  console.log("index.ts: Logging out");
  // TODO: call something from spotifyAPI.ts to delete the access token and reset states
});



// --- Playlist ---

ipcMain.on('choose-managed-playlist', async (_, playlistName: string) => {
  console.log("Got name of playlist to manage: " + playlistName);
  var playlistID = await searchAllPlaylistsForName(playlistName);
  if (playlistID == null){
    console.error("Could not find ID of playlist: " + playlistName);
    return;
  }
  
  console.log("Got playlist ID: " + playlistID);
  Storage.managedPlaylistId = playlistID;
});



// --- Rating ---


ipcMain.handle('rate-current-song', async (_, rating: rating) => {
  var songID = await getCurrentSong();
  if (!songID) {
    return;
  }

  Storage.addSongRating(songID, rating);
  console.log("Rated current song: ", songID, ", with rating: ", rating);
});

ipcMain.handle('rate-segment', async (_, rating: rating, seg_index: number) => {
  var songID = await getCurrentSong();
  if (!songID) return;

  Storage.addSegmentRating(songID, seg_index, rating);
  console.log(`Rated song [${songID}], segment [${seg_index}], with rating [${rating}]`);
});



// --- Window Management ---

// If not ALL windows are focusable = false while transparent = true, windows will always show 
// an ugly title bar behind everything when the window loses focus. 
// This title bar cannot be manually removed, but for some reason is gets hidden 
// when the window gets resized
app.on('browser-window-blur', () => {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      const [w, h] = win.getSize();
      win.setResizable(true);
      win.setSize(w, h + 1);
      win.setSize(w, h);
      win.setResizable(false);
    }
  }
});

app.on('browser-window-focus', () => {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      const [w, h] = win.getSize();
      win.setResizable(true);
      win.setSize(w, h + 1);
      win.setSize(w, h);
      win.setResizable(false);
    }
  }
});