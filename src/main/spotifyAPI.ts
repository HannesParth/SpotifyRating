import { createServer } from "http";
import { URL } from "url";
import { mainWindow } from ".";
import { app, shell } from "electron";
import { writeFileSync, readFileSync } from 'fs'
import path from "path";

const clientId = "99e38fb1a67b4588b75b9498eda217a6";
const clientSecret = "e53cf04f50734db9a06373e95b8deed5";

const redirectURI = "http://127.0.0.1:8000/callback";
const scopes = [
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private'
].join(' ');
const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectURI)}&scope=${encodeURIComponent(scopes)}`;


//#region Tokens
const tokenPath = path.join(app.getPath('userData'), 'tokens.json');

function saveTokens(tokens: TokenResponse) {
  writeFileSync(tokenPath, JSON.stringify(tokens))
}

function loadTokens(): TokenResponse | null {
  try {
    return JSON.parse(readFileSync(tokenPath, 'utf-8'))
  } catch {
    return null
  }
}

async function ensureToken(): Promise<string> {
  const tokens = loadTokens();

  if (!tokens) {
    const code = await getAuthCode();
    return await getAccessTokenFromAuthCode(code);
  }

  if (!tokens.isExpired()) {
    return tokens.access_token;
  }

  return await getAccessTokenFromRefresh(tokens.refresh_token);
}
//#endregion

export async function startSpotifyAuthFlow(): Promise<void> {
  await ensureToken();
  mainWindow?.webContents.send("spotify-token", true);
}


async function getAuthCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url || "", redirectURI);
      const code = url.searchParams.get("code");

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

async function getAccessTokenFromAuthCode(code: string): Promise<string> {
  // Exchange auth code for access token
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectURI, // just for validation
    }),
  });

  const rawData = await tokenRes.json();
  const tokenData = new TokenResponse(rawData);
  console.log("Spotify Tokens:", tokenData);
  saveTokens(tokenData);
  return tokenData.access_token;
}

async function getAccessTokenFromRefresh(refresh_token: string): Promise<string> {
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh_token,
      client_id: clientId,
    }),
  });

  const rawData = await tokenRes.json();
  const tokenData = new TokenResponse(rawData);
  saveTokens(tokenData);

  return tokenData.access_token;
}


class TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  fetchedAt: number;

  constructor(data: any) {
    if (!TokenResponse.isTokenResponse(data)) {
      throw new Error("Invalid token response data");
    }

    this.access_token = data.access_token;
    this.expires_in = data.expires_in;
    this.refresh_token = data.refresh_token;
    this.scope = data.scope;
    this.fetchedAt = Date.now()
    Object.freeze(this)
  }

  static isTokenResponse(data: any): data is TokenResponse {
    return (
      typeof data.access_token === 'string' &&
      typeof data.expires_in === 'number' &&
      typeof data.refresh_token === 'string' &&
      typeof data.scope === 'string'
    );
  }

  isExpired(): boolean {
    const current: number = Date.now();

    // 3 sec extra buffer
    return this.fetchedAt + this.expires_in - 3 < current;
  }
}