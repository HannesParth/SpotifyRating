import { app, BrowserWindow, ipcMain } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'

import { startSpotifyAuthFlow, searchAllPlaylists } from './spotifyAPI';
import { createOverlay, setLoggedInState } from './windows';
import { rating } from './utility';

// function createWindow(): void {
//   // Create the browser window.
//   mainWindow = new BrowserWindow({
//     width: 900,
//     height: 670,
//     show: false,
//     autoHideMenuBar: true,
//     ...(process.platform === 'linux' ? { icon } : {}),
//     webPreferences: {
//       preload: join(__dirname, '../preload/index.js'),
//       sandbox: false
//     }
//   })

//   mainWindow.on('ready-to-show', () => {
//     mainWindow.show()
//   })

//   mainWindow.webContents.setWindowOpenHandler((details) => {
//     shell.openExternal(details.url)
//     return { action: 'deny' }
//   })

//   // HMR for renderer base on electron-vite cli.
//   // Load the remote URL for development or the local html file for production.
//   if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
//     mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
//   } else {
//     mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
//   }
// }



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
  console.log("Got playlist: " + playlistName);
  var playlistID = await searchAllPlaylists(playlistName)
  if (playlistID == null){
    console.log("Could not find " + playlistName)
  }
  else{console.log("Got playlist ID: " + playlistID)}
});



// --- Rating ---

ipcMain.handle('rate-current-song', (_, rating: rating) => {
  // @Sara: get the rating here, then get the current song from the spotify api and cache that together
  // rating can be 0, -1 or 1, see type definition
  console.log("Rated current song: ", rating);
});

ipcMain.handle('rate-segment', (_, rating: rating, seg_index: number) => {
  // @Sara: get the rating here, then get the current song from the spotify api and cache that together
  // rating can be 0, -1 or 1, see type definition

  console.log("Rated current songs segment: ", seg_index, ", rating ", rating);
});

ipcMain.handle('is-song-rating-allowed', () => {
  // @Sara: check here if the current song is in the cache and has a rating other than 0
  // so it can not be rated more than once
  return true; // placeholder
});

ipcMain.handle('is-segment-rating-allowed', () => {
  // @Sara: check here if the current song is in the cache and has a segment rating other than 0
  // so it can not be rated more than once
  console.log("Checking");
  return false; // placeholder
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