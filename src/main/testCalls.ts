import { ipcMain } from "electron";
import { setSegments, setSongPlayingState } from "./windows";
import { getAllPlaylistSongs, getCurrentSongID, isTrackLastOfPlaylist } from "./spotifyAPI";
import { loadPythonModule } from "./index";


export function registerHandler(): void {
    // --- Test Button ---
    ipcMain.handle('test-button-call', async () => {
        // put any test calls here
        await loadPython();
    });
}


async function loadPython() {
    await loadPythonModule();
}

async function checkIsLastTrack() {
    const song = await getCurrentSongID();
    if (!song) {
        console.log("Null song");
        return;
    }
    const isLast = await isTrackLastOfPlaylist(song);
    console.log("is last? ", isLast);
}

function segmentTest(): void {
    setSegments([
        { from: 0, to: 0.15},
        { from: 0.15, to: 0.38 },
        { from: 0.38, to: 0.74 },
        { from: 0.74, to: 1 },
    ]);
    console.log("Current test: creating segments");
}

function simulatePlayingSongTest(): void {
    setSongPlayingState(true);
}
