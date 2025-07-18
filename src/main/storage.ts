import { rating } from "./utility";
import Store from "electron-store";


//const store = new Store();
const storeKey: string = 'ratedSongs';

let lastStored: Date;
let lastLoaded: Date;

export const ratedSongsRAM = new Map<string, RatedSong>();


export function addSongRating(track_id: string, rating: rating): void {
  const song = getOrMakeRatedSong(track_id);
  song.rating = rating;
  ratedSongsRAM.set(track_id, song);
}

export function addSegmentRating(track_id: string, segment_index: number, rating: rating): void {
  const song = getOrMakeRatedSong(track_id);
  song.segment_index = segment_index;
  song.segment_rating = rating;
  ratedSongsRAM.set(track_id, song);
}

export function isSongRated(track_id: string): boolean {
  return ratedSongsRAM.has(track_id) && ratedSongsRAM[track_id].rating !== null;
}

export function isSegmentRated(track_id: string): boolean {
  return ratedSongsRAM.has(track_id) 
    && ratedSongsRAM.get(track_id)?.segment_index !== null 
    && ratedSongsRAM.get(track_id)?.segment_rating !== null
}

function getOrMakeRatedSong(track_id: string): RatedSong {
  if (!ratedSongsRAM.has(track_id)) {
    return new RatedSong(track_id);
  } else {
    return ratedSongsRAM[track_id];
  }
}

// this is causing problems, I'll try again later
// export function getStoredSongs(): RatedSong[] {
//   const songs = store.get(storeKey);
// }

/**
 * Saransh's script expects both ratings to be in one object.
 * Since it is possible to either rate one or the other, both ratings can be null.
 */
export class RatedSong {
  track_id: string;
  rating: rating | null;
  segment_index: number | null;
  segment_rating: rating | null;

  constructor(trackId: string) {
    this.track_id = trackId;
    this.rating = null;
    this.segment_index = null;
    this.segment_rating = null;
  }
};