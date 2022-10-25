const { app, BrowserWindow, globalShortcut } = require("electron");
const path = require("path");
const url = require("url");

// Controllers
require('./controllers/os')

// Windows
let idleWin = null,
  setupWin = null;

function createWindow() {
  idleWin = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      preload: path.join(__dirname, "preload/idle.js"), // use a preload script
    },
  });

  const idleUrl =
    process.env.RENDERER_IDLE_URL ||
    url.format({
      pathname: path.join(__dirname, "/../renderers/idle/build/index.html"),
      protocol: "file:",
      slashes: true,
    });

  idleWin.loadURL(idleUrl);

  idleWin.webContents.openDevTools();
}

app
  .whenReady()
  .then(() => {
    globalShortcut.register("Alt+CommandOrControl+S", () => {
      if (setupWin) {
        setupWin.close()
        setupWin = null;
        return
      }
      setupWin = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
          nodeIntegration: false, // is default value after Electron v5
          contextIsolation: true, // protect against prototype pollution
          enableRemoteModule: false, // turn off remote
          preload: path.join(__dirname, "preload/setup.js"), // use a preload script
        },
      });

      const setupUrl =
        process.env.RENDERER_SETUP_URL ||
        url.format({
          pathname: path.join(
            __dirname,
            "/../renderers/setup/build/index.html"
          ),
          protocol: "file:",
          slashes: true,
        });

      setupWin.loadURL(setupUrl);

      setupWin.on('close', () => {
        setupWin = null;
      })

      setupWin.webContents.openDevTools();
    });
  })
  .then(() => {
    createWindow();

    app.on("activate", function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
