import { rating } from "./utility";
//import Store from "electron-store";


//const store = new Store();
const storeKey: string = 'ratedSongs';

let lastStored: Date;
let lastLoaded: Date;

const ratedSongsRAM = new Map<string, RatedSong>();

/**
 * ID of the currently managed playlist.
 * I'm limiting it to 1 for this prototype, among other reasons because
 * you cannot differentiate from which playlist a song is if you have
 * multiple playlists with the same song.
 */
let managedPlaylistId: string = "";


function addSongRating(track: SpotifyApi.TrackObjectFull, rating: rating): void {
  const song = getOrMakeRatedSong(track);
  song.rating = rating;
  ratedSongsRAM.set(track.id, song);
}

function addSegmentRating(track: SpotifyApi.TrackObjectFull, segment_index: number, rating: rating): void {
  const song = getOrMakeRatedSong(track);
  song.segment_index = segment_index;
  song.segment_rating = rating;
  ratedSongsRAM.set(track.id, song);
}

function isSongRated(track_id: string): boolean {
  const song = ratedSongsRAM.get(track_id);
  if (!song) return false;
  if (!song.rating) return false;
  return song !== undefined && song.rating !== null;
}

function isSegmentRated(track_id: string): boolean {
  return ratedSongsRAM.has(track_id) 
    && ratedSongsRAM.get(track_id)?.segment_index !== null 
    && ratedSongsRAM.get(track_id)?.segment_rating !== null
}

function getSongRating(track_id: string): rating | null {
  if (!isSongRated(track_id)) return null;

  const song: RatedSong = ratedSongsRAM.get(track_id)!;
  return song.rating
}

function getSegmentRating(track_id: string): {segment_index: number, segment_rating: number} | null{
  if (!isSegmentRated(track_id)) return null;

  const song: RatedSong = ratedSongsRAM[track_id];
  return {
    segment_index: song.segment_index!,
    segment_rating: song.segment_rating!
  }
}

function getOrMakeRatedSong(track: SpotifyApi.TrackObjectFull): RatedSong {
  const track_id: string = track.id;
  if (!ratedSongsRAM.has(track_id)) {
    return new RatedSong(track);
  } else {
    return ratedSongsRAM[track_id];
  }
}

// export in correct format for the recommender
function getForExport() : RatedSong[] {
  var storage = Array.from(ratedSongsRAM.values())
  return storage
}

// export function getStoredSongs(): RatedSong[] {
//   const songs = ratedSongsRAM.get(storeKey);
//   if (songs == undefined){
//     throw Error("Could not retrieve rated songs")
//   }
//   return [songs]
// }

// this is causing problems, I'll try again later
// export function getStoredSongs(): RatedSong[] {
//   const songs = store.get(storeKey);
// }



export default {
  addSongRating,
  addSegmentRating,
  isSongRated, 
  isSegmentRated,
  getSongRating,
  getSegmentRating,
  getForExport,
  managedPlaylistId
};


/**
 * Saransh's script expects both ratings to be in one object.
 * Since it is possible to either rate one or the other, both ratings can be null.
 */
export class RatedSong {
  track_id: string;
  title : string;
  artist: string;
  rating: rating | null;
  segment_index: number | null;
  segment_rating: rating | null;

  constructor(track: SpotifyApi.TrackObjectFull) {
    this.track_id = track.id;
    this.title = track.name;
    this.artist = track.artists[0].name;
    this.rating = null;
    this.segment_index = null;
    this.segment_rating = null;
  }
};