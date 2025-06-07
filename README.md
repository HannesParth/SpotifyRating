# Notes
electron-vite "Getting Started": https://electron-vite.org/guide/
On making an app with multiple windows: https://electron-vite.org/guide/dev#multiple-windows-app

Vite Overview: https://vite.dev/guide/#overview


Setup:
1. Make sure Node v.20+ is installed
2. Open the Terminal in VS Code after navigating to the project folder
3. Run the latest electron-vite setup: npm create @quick-start/electron@latest
4. Agree to installing the @quick-start/create-electron package
5. Choose react + typescript in the installation choices
6. Set a project name (I have "spotify-rating")
7. Add Electron updater plugin? -> Yes
8. Enable Electron download mirror proxy? -> Yes
9. Follow the given commands (use `cd` to navigate to new project directory, run `npm install` and `npm run dev`)





# spotify-rating

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
 -> I've removed Prettier because gave me a bunch of warnings that were literally unfixable

## Project Setup

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
