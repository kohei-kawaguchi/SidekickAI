const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { app, BrowserWindow, Tray, Menu, nativeImage, screen } = require('electron');
const { loadConfig, resolveProjectPath } = require('./config');
const { startStatusServer } = require('./server');
const { startClaudeDesktopAdapter } = require('./adapters/claudeDesktop');

const config = loadConfig('config/sidekick.json');
let mainWindow;
let tray;
let idleTimer;

function createWindow(windowConfig) {
  const { workArea } = screen.getPrimaryDisplay();
  const window = new BrowserWindow({
    width: windowConfig.width,
    height: windowConfig.height,
    x: workArea.x + workArea.width - windowConfig.width - windowConfig.marginRight,
    y: workArea.y + workArea.height - windowConfig.height - windowConfig.marginBottom,
    transparent: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    alwaysOnTop: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  window.setAlwaysOnTop(true, 'screen-saver');
  window.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  return window;
}

function createTray(imagePath) {
  const trayIcon = new Tray(nativeImage.createFromPath(imagePath).resize({ width: 16, height: 16 }));
  trayIcon.setToolTip('sidekick');
  trayIcon.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow.show() },
    { label: 'Hide', click: () => mainWindow.hide() },
    { label: 'Quit', click: () => app.quit() },
  ]));
  return trayIcon;
}

function showStatus(status) {
  mainWindow.webContents.send('status', status);
}

function handleEvent(event) {
  clearTimeout(idleTimer);
  showStatus({ state: event.state, line: config.states[event.state].line, source: event.source, message: event.message });
  if (event.state === 'done') {
    idleTimer = setTimeout(() => handleEvent({ source: event.source, state: 'idle', message: '' }), config.doneToIdleSeconds * 1000);
  }
}

app.whenReady().then(() => {
  const imagePath = resolveProjectPath(config.character.image);
  mainWindow = createWindow(config.window);
  tray = createTray(imagePath);
  mainWindow.webContents.on('did-finish-load', () => {
    showStatus({ state: 'idle', line: config.startupLine, source: 'sidekick', message: '', image: pathToFileURL(imagePath).href });
    startStatusServer(config.server.host, config.server.port, Object.keys(config.states), handleEvent);
    startClaudeDesktopAdapter(config.claudeDesktop, handleEvent);
  });
});
