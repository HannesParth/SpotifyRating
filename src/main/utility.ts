import { BrowserWindow, screen } from "electron";
import { join } from "path";



export type rating = -1 | 0 | 1;

export type windowPos = 
  | 'start'
  | 'center'
  | 'end';


export function createOverlayWindow(
  width: number,
  height: number,
  x: windowPos,
  y: `${number}%`,
): BrowserWindow;

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


// this function is an abomination
// - sincerely, the guy who made it
export function createOverlayWindow(
  width: number,
  height: number,
  x: number | `${number}%` | windowPos,
  y: number | `${number}%`,
  parent?: BrowserWindow | undefined
): BrowserWindow {
  const display = screen.getPrimaryDisplay();
  const scale = display.scaleFactor;

  if ((x === 'start' || x === 'center' || x === 'end') && typeof y === 'string') {
    const { width: screenWidth, height: screenHeight } = display.workArea;
    switch (x) {
      case 'start':
        x = 0;
        break;
      case 'center':
        x = (screenWidth / 2) - (width / 2);
        break;
      case "end":
        x = screenWidth - width;
        break;
      default:
        x = 0;
        break;
    }
    const yPercent = parseFloat(y) / 100;
    y = Math.round(screenHeight * yPercent);
  } else if (typeof x === 'string' && typeof y === 'string') {
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