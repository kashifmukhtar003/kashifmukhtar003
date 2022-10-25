/* eslint-disable */
/* eslint global-: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, shell, globalShortcut, ipcMain } from 'electron';
const dotenv = require('dotenv').config();
const dotenvExpand = require('dotenv-expand');
dotenvExpand.expand(dotenv)
// import { autoUpdater } from 'electron-updater';
// import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
// Controllers
require('./controllers/os/index');
require('./controllers/auth/index');
require('./controllers/heartbeat/index');
const nextShowHandler = require('./controllers/show');
require('./controllers/dchp/index');
require('./db/index');
const startProcess = require('./core/app');
const RealmDB = require('../brain/db/index');
// const Sentry = require("@sentry/electron");

// export default class AppUpdater {
//   constructor() {
//     log.transports.file.level = 'info';
//     autoUpdater.logger = log;
//     autoUpdater.checkForUpdatesAndNotify();
//   }
// }

// Windows
// let mainWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
let setupWin: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}
// if (process.env.NODE_ENV === 'production') {
//   Sentry.init({
//     dsn: process.env.SENTRY_DSN,
//     environment: process.env.NODE_ENV,
//     //release: add current release here 
//   });
// }

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async (name: string) => {
  if (isDevelopment) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const preloadPath = path.join(
    __dirname,
    app.isPackaged ? `/preload${name}.js` : `/preload/${name}.js`
  );

  const window = new BrowserWindow({
    show: false,
    width: 1920,
    height: 1080,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: preloadPath,
    },
  });

  window.loadURL(resolveHtmlPath('index.html'));

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/main/docs/api/browser-window.md#using-ready-to-show-event
  window.webContents.on('did-finish-load', () => {
    if (!window) {
      throw new Error('"window" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      window.minimize();
    } else {
      window.show();
      window.focus();
    }
  });

  const menuBuilder = new MenuBuilder(window);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  window.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  // new AppUpdater();

  return window;
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    RealmDB.closeRealmInstance();
    app.quit();
  }
});

ipcMain.on('close-window', function () {
  if (setupWin) {
    setupWin.close();
  }
});

app
  .whenReady()
  .then(async () => {
    mainWindow = await createWindow('idle');
    mainWindow.on('close', () => {
      setupWin = null;
    });

    //* Start interval on idle screen, if authorized then interval will run otherwise user will have to setup the machine
    startProcess(mainWindow);

    globalShortcut.register('Alt+CommandOrControl+S', async () => {
      if (setupWin) {
        setupWin.close();
        setupWin = null;
        return;
      }

      setupWin = await createWindow('setup');
      setupWin.on('close', () => {
        setupWin = null;
      });
    });

    globalShortcut.register('Alt+CommandOrControl+A', () => {
      nextShowHandler({ action: 'execShow' });
    });
  })
  .catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow('idle');
});
