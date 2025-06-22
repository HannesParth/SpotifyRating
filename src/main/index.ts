import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

import { startSpotifyAuthFlow } from './spotifyAPI';
import { createOverlayWindow } from './utility';

let outputOverlay: BrowserWindow;
let loginOverlay: BrowserWindow;
let songRateOverlay: BrowserWindow;
let setPlaylistOverlay: BrowserWindow;

const devURL = "http://localhost:5173";


const setPlaylistButtonSize = {
  width: 140,
  height: 45,
}

const setPlaylistWithInputSize = {
  width: 200,
  height: 130,
}

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

export function showOutput(msg: string): void {
  outputOverlay.webContents.send('display-output', msg);
}

export function setLoggedInState(state: boolean): void {
  loginOverlay.webContents.send('set-sign-in-state', state);
  setPlaylistOverlay.webContents.send('set-sign-in-state', state);
}

function createOverlay(): void {
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

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})



// Called when the Login Button is pressed
ipcMain.handle('start-spotify-auth', () => {
  startSpotifyAuthFlow();
});


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



ipcMain.on('choose-managed-playlist', (_, playlistName: string) => {
  console.log("Got name of playlist to manage: " + playlistName);
});



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