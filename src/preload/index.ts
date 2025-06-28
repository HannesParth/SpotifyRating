import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { InfoPopupData } from '../main/utility'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
    contextBridge.exposeInMainWorld('spotifyAPI', {
      auth: () => ipcRenderer.invoke('start-spotify-auth'),
    });
    contextBridge.exposeInMainWorld('backend', {
      showInfoPopup: (data: InfoPopupData) => ipcRenderer.invoke('show-info-popup', data),
      hideInfoPopup: (id: number) => ipcRenderer.invoke('hide-info-popup', id),
      resizeInfoPopup: (width: number, height: number, id: number) => ipcRenderer.invoke('resize-info-popup', width, height, id),
    });
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
