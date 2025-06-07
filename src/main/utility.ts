import { BrowserWindow } from "electron";
import { join } from "path";


export function createOverlayWindow(width: number, height: number, x: number, y: number, focusable: boolean = false): BrowserWindow {
    const overlay =  new BrowserWindow({
        width: width,
        height: height,
        show: false,
        x: x,
        y: y,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        hasShadow: false,
        focusable: focusable,
        webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        nodeIntegration: false,
        contextIsolation: true,
        },
    });

    overlay.on('ready-to-show', () => {
        overlay.show()
    });

    return overlay;
}