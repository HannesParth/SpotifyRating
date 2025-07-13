import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { InfoPopupData, rating } from '../main/utility'

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
      logout: () => ipcRenderer.invoke('spotify-logout'),
    });
    contextBridge.exposeInMainWorld('backend', {
      showInfoPopup: (data: InfoPopupData) => ipcRenderer.invoke('show-info-popup', data),
      hideInfoPopup: (id: number) => ipcRenderer.invoke('hide-info-popup', id),
      resizeInfoPopup: (width: number, height: number, id: number) => ipcRenderer.invoke('resize-info-popup', width, height, id),
      rateCurrentSong: (rating: rating) => ipcRenderer.invoke('rate-current-song', rating),
      rateCurrentSongSegment: (rating: rating, seg_index: number) => ipcRenderer.invoke('rate-segment', rating, seg_index),
      isSongRatingAllowed: () => ipcRenderer.invoke('is-song-rating-allowed'),
      isSegmentRatingAllowed: () => ipcRenderer.invoke('is-segment-rating-allowed'),
      callTest: () => ipcRenderer.invoke('test-button-call'),
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
