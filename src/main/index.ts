import { app, BrowserWindow, ipcMain } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'

import { startSpotifyAuthFlow, searchAllPlaylistsForName, getCurrentSongID, addTrackToPlaylist, getCurrentSong } from './spotifyAPI';
import { createOverlay, setLoggedInState, showOutput } from './windows';
import { rating } from './utility';
import Storage from './storage';
import path from 'path';



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
  var song = await getCurrentSong();
  if (!song) {
    return;
  }

  Storage.addSongRating(song, rating);
  console.log("Rated current song: ", song, ", with rating: ", rating);
});

ipcMain.handle('rate-segment', async (_, rating: rating, seg_index: number) => {
  var song = await getCurrentSong();
  if (!song) return;

  Storage.addSegmentRating(song, seg_index, rating);
  console.log(`Rated song [${song.id}], segment [${seg_index}], with rating [${rating}]`);
});



// --- Recommend ---

const nodecallspython = require("node-calls-python");

const py = nodecallspython.interpreter;
const recommenderDir = path.join(__dirname, "../../Recommender/recommender.py");
let pymodule: any;

export async function loadPythonModule() {
  console.log("Starting python module load");
  pymodule = await py.import(recommenderDir);
  console.log("Finished loading python module");
  showOutput("Finished loading python module.");
}

loadPythonModule();

type RecommendationAnswer = {
  title: string,
  artist: string,
  result: "recommended" | "unrated",
}

function isRecommendationAnswer(obj: any): obj is RecommendationAnswer {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.title === "string" &&
    typeof obj.artist === "string" &&
    (obj.result === "recommended" || obj.result === "unrated")
  );
}

export async function recommendNextSong() {
  console.log("\nRecommending song now");

  if (!pymodule) {
    console.error("Loading recommender python module failed");
    return;
  }
  
  const songId = await getCurrentSongID();
  if (!songId) {
    return;
  }
  const ratedSongs = Storage.getForExport();
  console.log("Recommender gets: \n", ratedSongs);
  
  const result = await py.call(pymodule, "recommend_next_song", ratedSongs);
  console.log("Got recommendation: ", result, " when playing song ", songId);

  if (!isRecommendationAnswer(result)) {
    console.log("Recommendation result was not a string");
    return;
  }

  // console.log("Trying to add to playlist");
  // await addTrackToPlaylist(Storage.managedPlaylistId, result);
}



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