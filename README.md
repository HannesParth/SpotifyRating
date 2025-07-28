# Rate Support

An Electron application with React and TypeScript. Made as an overlay for Spotify to enable users to rate songs and song segments, resulting in better recommendations.


## Architecture and usage
This project works in three parts:
1. The electron-vite desktop app
2. Requests to the [Spotify Web API](https://developer.spotify.com/documentation/web-api)
3. A content-feature based recommender using a snippet of the [Million Song Dataset](http://millionsongdataset.com/)

The Electron "backend" can be found in `src/main`.
The various UI elements can be found in `src/renderer`.
The recommender can be found in `Recommender`.

The Output Window and Test button can be enabled/disabled at the top of `src/main/windows.ts`.
Due to problems most likely caused by the [node-calls-python package](www.npmjs.com/package/node-calls-python), the Segment Bar does currently not display the actual song segments. 
To test the UI elements themselves, the Test button in its current setup can be used to 
1. show example segments
2. try to get the segment data from the MSD and see that in the terminal


The initial plan was for the recommender to use the [Audio Features](https://developer.spotify.com/documentation/web-api/reference/get-audio-features) and [Audio Analysis](https://developer.spotify.com/documentation/web-api/reference/get-audio-analysis) endpoints of the web api, before we noticed that these have been deprecated for commercial reasons several months ago. 
We then pivoted to use the Million Song Dataset (MSD) instead, which comes with some problems.
- The track_ids in the MSD are not the same as the ones from current Spotify
- The MSD does not contain every song currently on Spotify, and we had to shorten our snippet of it even more to upload it to GitHub without LFS

Other problems were caused by Electron making it *possible* to create multiple transparent windows without borders, but clearly not having the best support for it. Hence, all the Electron windows flicker with a grey title bar when deselected (see the bottom of `src/main/index.ts` for that workaround) and the Segment Bar hat to be placed a good bit above Spotify's song controls for it to not inexplicably vanish or block a bigger space than its root element covers.

## Project Setup
This project is using electron-vite: https://electron-vite.org/guide/
On making an app with multiple windows: https://electron-vite.org/guide/dev#multiple-windows-app

Vite Overview: https://vite.dev/guide/#overview

**Prerequisites to run this project:**
- Node version >=20 (currently using v22.16.0)
- A global Python 3.10 installation (I was unable to get this [package](www.npmjs.com/package/node-calls-python) to work using environments or user-specific installations)
- The Python packages pandas, numpy and scikit-learn installed in that global Python installation


After cloning this repository, run `npm install`.
After that `npm run dev` should work.
**This project has not been tested as a production build.**



### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
