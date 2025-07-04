import { app, BrowserWindow, ipcMain } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'

import { startSpotifyAuthFlow } from './spotifyAPI';
import { createOverlay, setLoggedInState } from './windows';

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

// Called when the Logout Button is pressed
ipcMain.handle('spotify-logout', () => {
  setLoggedInState(false);
  console.log("index.ts: Logging out");
  // TODO: call something from spotifyAPI.ts to delete the access token and reset states
})



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