import { createServer } from "http";
import { URL } from "url";
import { app, shell, ipcMain } from "electron";
import { writeFileSync, readFileSync } from 'fs'
import path from "path";
import { setLoggedInState, showOutput } from "./windows";

// To read more about the used package: https://www.npmjs.com/package/spotify-web-api-node?activeTab=readme
import SpotifyWebApi from 'spotify-web-api-node';
import { rating } from "./utility";

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
  'playlist-modify-private'
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

//#region Playlist
function getPlaylist(playlistName: any) {
  return playlistName
}

// ipcMain.on('choose-managed-playlist', async (_: any, playlistName: string) => {
//   getPlaylist(playlistName);
//   console.log("Got playlist: " + playlistName);
//   var playlistID = await searchAllPlaylists(playlistName)
//   if (playlistID == null){
//     console.log("Could not find " + playlistName)
//   }
//   else{console.log("Got playlist ID: " + playlistID)}
// });

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

// async function getAllPlaylist(): Promise<string> {
// // Get a user's playlists
// var userID = await getUserID();
// var allPlaylists = await spotifyApi.getUserPlaylists(userID)
//   .then(function(data) {
//     console.log('Retrieved playlists', data.body);
//   },function(err) {
//     console.log('Something went wrong!', err);
//   })
//   return allPlaylists;
// }

export async function searchAllPlaylists(playlistName: string): Promise<string | null> {
  var response = await spotifyApi.getUserPlaylists(await getUserID());
  var allP = response.body.items;

  var  foundP = allP.find(
      (playlist) => playlist.name === playlistName
    );
    return foundP ? foundP.id : null
}

export async function playlistSongs(playlistID: string) {
  //var fields:string = "items(track(id))"; // fix this to only retrieve songIDs
  var response = (await spotifyApi.getPlaylistTracks(playlistID)).body.items;
  var songIDs: any[] = [] //using any isn't good but I am tired
  for (let i=0; i++; i<response.length){
      songIDs.push(response[i].track?.id)
  }
  console.log("Retrieved all song IDs from playlist"+ songIDs);
  return songIDs
}
//#endregion

//#region Rating
export async function getCurrentSong(): Promise<string | null> {
  var songID = (await spotifyApi.getMyCurrentPlayingTrack()).body.item?.id!;
  if(songID === null){
    console.log("Error, songID is null")
  }
  else{
      console.log("Got songID " + spotifyApi.getMyCurrentPlayingTrack());
  }
  return songID
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