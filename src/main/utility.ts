import { BrowserWindow, screen } from "electron";
import { join } from "path";


export function createOverlayWindow(
  width: number,
  height: number,
  x: number,
  y: number,
): BrowserWindow;

export function createOverlayWindow(
  width: number,
  height: number,
  xPercent: `${number}%`,
  yPercent: `${number}%`,
): BrowserWindow;

export function createOverlayWindow(
  width: number,
  height: number,
  x: number | `${number}%`,
  y: number | `${number}%`,
  parent?: BrowserWindow | undefined
): BrowserWindow {
    const display = screen.getPrimaryDisplay();
    const scale = display.scaleFactor;

    if (typeof x === 'string' && typeof y === 'string') {
        const { width: screenWidth, height: screenHeight } = display.workArea;
        const xPercent = parseFloat(x) / 100;
        const yPercent = parseFloat(y) / 100;
        x = Math.round(screenWidth * xPercent);
        y = Math.round(screenHeight * yPercent);
    } else {
        x = x as number;
        y = y as number;
        x = Math.round(x / scale);
        y = Math.round(y / scale);
    }

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
        titleBarStyle: 'hidden',
        resizable: false,
        hasShadow: false,
        focusable: true,
        parent: parent,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
        },
    });

    overlay.on('ready-to-show', () => {
        overlay.show();
    });

  return overlay;
}


export interface InfoPopupData {
  x: number;
  y: number;
  header: string;
  body: string;
  isError: boolean;
}