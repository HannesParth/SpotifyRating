import { ElectronAPI } from '@electron-toolkit/preload'
import { InfoPopupData, rating } from '../main/utility'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    spotifyAPI: {
      auth: () => Promise,
      logout: () => Promise
    }
    backend: {
      showInfoPopup: (data: InfoPopupData) => Promise,
      hideInfoPopup: (id: number) => Promise,
      resizeInfoPopup: (width: number, height: number, id: number) => Promise,
      rateCurrentSong: (rating: rating) => Promise,
      rateCurrentSongSegment: (rating: rating, seg_index: number) => Promise,
      isSongRatingAllowed: () => Promise<boolean>,
      isSegmentRatingAllowed: () => Promise<boolean>,
      callTest: () => Promise,
    }
  }
}
