import { ipcMain } from "electron";
import { setSegments, setSongPlayingState } from "./windows";




export function registerHandler(): void {
    // --- Test Button ---
    ipcMain.handle('test-button-call', () => {
        // put any test calls here
        simulatePlayingSongTest();
    });
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