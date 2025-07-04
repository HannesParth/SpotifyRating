import { ElectronAPI } from '@electron-toolkit/preload'
import { InfoPopupData } from '../main/utility'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    spotifyAPI: {
      auth: () => Promise,
      logout: () => void
    }
    backend: {
      showInfoPopup: (data: InfoPopupData) => void,
      hideInfoPopup: (id: number) => void,
      resizeInfoPopup: (width: number, height: number, id: number) => void,
    }
  }
}
