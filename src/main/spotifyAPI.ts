import { createServer } from "http";
import { URL } from "url";
import { app, shell } from "electron";
import { writeFileSync, readFileSync } from 'fs'
import path from "path";
import { setLoggedInState, showOutput } from "./windows";
import Storage from "./storage";

// To read more about the used package: https://www.npmjs.com/package/spotify-web-api-node?activeTab=readme
import SpotifyWebApi from 'spotify-web-api-node';

const clientId = "99e38fb1a67b4588b75b9498eda217a6";
const clientSecret = "e53cf04f50734db9a06373e95b8deed5";

const redirectURI = "http://127.0.0.1:8000/callback";


var spotifyApi = new SpotifyWebApi({
  clientId: clientId,
  clientSecret: clientSecret,
  redirectUri: redirectURI,
});

const scopes = [
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-currently-playing',
  'user-read-playback-state'
];
const authUrl = spotifyApi.createAuthorizeURL(scopes, 'state-key');


//#region Tokens
const tokenPath = path.join(app.getPath('userData'), 'tokens.json');

function saveTokens(tokens: TokenResponse) {
  console.log("Saving tokens temporarily disabled because fucky");
  return;
  writeFileSync(tokenPath, JSON.stringify(tokens));
  console.log("Saved tokens (at AppData/Roaming/[App Name] for windows)");
}

function loadTokens(): TokenResponse | null {
  try {
    const jsonData = JSON.parse(readFileSync(tokenPath, 'utf-8'));
    return new TokenResponse(jsonData, true);
  } catch {
    return null
  }
}

async function ensureToken(): Promise<string | null> {
  const tokens = loadTokens();
  console.log("loaded tokens");

  let accessToken: string | null = null;

  if (tokens == null || tokens == undefined) {
    console.log("Loaded null tokens, starting auth code flow");
    showOutput("Loaded null tokens, starting auth code flow");
    await getAuthCode();
    accessToken = spotifyApi.getAccessToken()!;
  }
  else if (!tokens.isExpired()) {
    console.log("Got token: " + tokens.access_token);
    showOutput("Got token, not expired");
    accessToken = tokens.access_token;
    spotifyApi.setAccessToken(tokens.access_token);
    spotifyApi.setRefreshToken(tokens.refresh_token);
  }
  else {
    console.log("Tokens expired");

    spotifyApi.setRefreshToken(tokens.refresh_token);
    await spotifyApi.refreshAccessToken();
    accessToken = spotifyApi.getAccessToken()!;
    showOutput("Got token from refresh");
  }

  setLoggedInState(!!accessToken);
  return accessToken;
}
//#endregion



//#region User
async function getUser() {
  // Get the authenticated user
  return spotifyApi.getMe();
  // .then(function(data) {
  //   console.log('Some information about the authenticated user', data.body);
  //   return data.body;
  // }, function(err) {
  //   console.log('Something went wrong!', err);
  // });
}

async function getUserID(): Promise<string>{
  var user = await getUser();
  console.log('Returned current user ID', user.body.id);
  return user.body.id;
}


//#endregion



//#region Playlist


export async function searchAllPlaylistsForName(playlistName: string): Promise<string | null> {
  var response = await spotifyApi.getUserPlaylists(await getUserID());
  var allP = response.body.items;

  var  foundP = allP.find(
    (playlist) => playlist.name === playlistName
  );
  return foundP ? foundP.id : null
}

//returns all playlist tracks with all info
export async function getAllPlaylistSongs(playlistID: string) {
  const response = await spotifyApi.getPlaylistTracks(playlistID);
  const tracks = response.body.items;
  return tracks;
}

export async function isTrackLastOfPlaylist(trackId: string): Promise<boolean> {
  if (!Storage.managedPlaylistId) {
    console.log("isLast: no managed playlist");
    return false;
  }

  const tracks = await getAllPlaylistSongs(Storage.managedPlaylistId);
  if (tracks.length < 1) {
    console.log("isLast: no tracks");
    return false;
  }

  //console.log("Got tracks: ", tracks.map(obj => obj.track?.name));
  const last = tracks[tracks.length-1];
  if (!last.track) {
    console.log("isLast: last track is null");
    return false;
  }
  return last.track.id === trackId;
}


export async function addTrackToPlaylist(playlistID: string, track: string) {
  const trackUri = "spotify:track:" + track;
  const data = [trackUri];
  await spotifyApi.addTracksToPlaylist(playlistID, data);
}

export async function getPlaylistSongIDs(playlistID: string): Promise<string[]> {
  //var fields:string = "items(track(id))"; // fix this to only retrieve songIDs
  var response = (await spotifyApi.getPlaylistTracks(playlistID)).body.items;
  
  const songIDs: string[] = [];
  for (const trackObj of response) {
    if (!trackObj.track) continue;
    songIDs.push(trackObj.track.id);
  }
  //console.log(`Retrieved ${songIDs.length} song IDs from playlist ${playlistID}`);
  return songIDs
}

export async function returnTrack(spotifySongID: string) {
  var response = await spotifyApi.getTrack(spotifySongID);
  var track = response.body
  return track;
}

// export async function searchByNameAndArtist(title: string, artist: string) {
//   const response = (await spotifyApi.searchTracks(title, {limit:1, offset:0})).body;
// } //do not use spotifyAPI.methed for this, make direct spotify web api request

// Search tracks whose artist's name contain artist and track name contains title
export async function searchByNameAndArtist(title:string, artist:string) { //idk why this says I'm returning an undefined
  const both = 'track:'+title+' artist:'+artist

  var response = await spotifyApi.searchTracks(both);

  if(!response){
    console.log('Was not able to find song of title '+ title+ ' from artist: ' + artist);
    return null
  }else{
    console.log('Found song id ' + response.body.tracks?.items[0].id)
    return response.body.tracks?.items[0].id
  }


  // spotifyApi.searchTracks(both)
  // .then(function(data) {
  //   console.log('Search for track of title '+ title+ ' from artist: '+ artist);
  //   console.log('Search returns track with title '+ data.body.tracks?.items[0].name + 
  //   ' from artist: '+ data.body.tracks?.items[0].name + 
  //   ' with spotify trackID ' + data.body.tracks?.items[0].id); //just take the first result
  //   if(!(data.body.tracks?.items[0].id)){
  //     return null
  //   }
  //   else{
  //     return data.body.tracks?.items[0].id!
  //   }
  // }, function(err) {
  //   console.log('Was not able to find song by title and artist', err);
  //   return null
  // });
}


//#endregion




//#region Track

/**
 * Get the ID of the currently playing track, but only if it is in the current managed playlist.
 * Otherwise returns null
 */
export async function getCurrentSongID(): Promise<string | null> {
  if (!spotifyApi.getAccessToken()) {
    return null;
  }
  const response = await spotifyApi.getMyCurrentPlaybackState();

  if (!response.body) {
    return null;
  }
  if (!response.body.item) {
    console.warn("getCurrentSong: item was null");
    return null;
  }
  if (!response.body.context || (response.body.context && response.body.context.type !== "playlist")) {
    console.warn("getCurrentSong: user is not in a playlist");
    return null;
  }

  const songID: string = response.body.item.id;
  const playlistUri = response.body.context.uri;
  const playlistId = playlistUri.split(':')[2];

  if (!Storage.managedPlaylistId) {
    console.warn("getCurrentSong: managed Playlist not set");
    return null;
  }
  if (playlistId !== Storage.managedPlaylistId) {
    console.warn("Current song is not in managed playlist");
    return null;
  }
  return songID;
}

export async function getCurrentSong(): Promise<SpotifyApi.TrackObjectFull | null> {
  if (!spotifyApi.getAccessToken()) {
    return null;
  }
  const response = (await spotifyApi.getMyCurrentPlaybackState());

  if (!response.body) {
    return null;
  }
  if (!response.body.item) {
    console.warn("getCurrentSong: item was null");
    return null;
  }
  if (!response.body.context || (response.body.context && response.body.context.type !== "playlist")) {
    console.warn("getCurrentSong: user is not in a playlist");
    return null;
  }

  const track = response.body.item as SpotifyApi.TrackObjectFull;

  const playlistUri = response.body.context.uri;
  const playlistId = playlistUri.split(':')[2];

  if (!Storage.managedPlaylistId) {
    console.warn("getCurrentSong: managed Playlist not set");
    return null;
  }
  if (playlistId !== Storage.managedPlaylistId) {
    console.warn("Current song is not in managed playlist");
    return null;
  }
  return track;
}


export async function getCurrentPlayingSong(): Promise<string | null> {
  const response = await spotifyApi.getMyCurrentPlayingTrack();
  const playingObj = response.body.item;

  if (!playingObj) {
    console.warn("Could not get current song!");
    return null
  }

  const songID: string = playingObj.id;
  //console.log("Got songID: ", songID);
  return songID;
}

//#endregion




export async function startSpotifyAuthFlow(): Promise<void> {
  console.log("\nStarting spotify auth flow");
  await ensureToken();
}


async function getAuthCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url || "", redirectURI);
      const code = url.searchParams.get("code")!;

      const data = await spotifyApi.authorizationCodeGrant(code);
      const access_token = data.body['access_token'];
      const refresh_token = data.body['refresh_token'];

      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      console.log('Access Token:', access_token);

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<h1>Login successful. You can now close the window.</h1>");

      server.close();

      if (code) {
        resolve(code);
      } else {
        reject(new Error("No code found in redirect"));
      }
    });

    server.listen(8000, "127.0.0.1", () => {
      console.log(`Listening on ${redirectURI}`);
      try {
        shell.openExternal(authUrl);
      } catch (err) {
        server.close();
        reject(err);
      }
    });
  });
}




class TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  fetchedAt: number;

  constructor(data: any, loadedFromSave: boolean) {
    if (!TokenResponse.isTokenResponse(data)) {
      throw new Error("Invalid token response data");
    }

    this.access_token = data.access_token;
    this.expires_in = data.expires_in;
    this.refresh_token = data.refresh_token;
    this.scope = data.scope;

    if (loadedFromSave) {
      this.fetchedAt = data.fetchedAt;
    } else {
      this.fetchedAt = Date.now()
    }
    
    Object.freeze(this)
  }

  public static isTokenResponse(data: any): data is TokenResponse {
    const isToken: boolean =  (
      typeof data.access_token === 'string' &&
      typeof data.expires_in === 'number' &&
      typeof data.refresh_token === 'string' &&
      typeof data.scope === 'string'
    );

    if (!isToken) {
      console.log("isTokenResponse: false -> \n", data);
    }
    return isToken;
  }

  public isExpired(): boolean {
    const current: number = Date.now();

    console.log("Token time left: " + (this.fetchedAt + this.expires_in - current));
    console.log("Fetched at: ", this.fetchedAt);
    console.log("Current: ", current);
    // 3 sec extra buffer
    return this.fetchedAt + this.expires_in - 3 < current;
  }
}