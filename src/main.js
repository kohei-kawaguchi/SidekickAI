const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { app, BrowserWindow, Tray, Menu, nativeImage, screen } = require('electron');
const { loadConfig, resolveProjectPath } = require('./config');
const { startStatusServer } = require('./server');
const { startClaudeDesktopAdapter } = require('./adapters/claudeDesktop');

const config = loadConfig('config/sidekick.json');
const character = loadCharacter(config.characterConfig, config.states);
let mainWindow;
let tray;
let idleTimer;

function loadCharacter(relativePath, states) {
  if (!fs.existsSync(resolveProjectPath(relativePath))) {
    throw new Error(`${relativePath} not found. Copy config/character.example.json to ${relativePath} and edit it.`);
  }
  const loaded = loadConfig(relativePath);
  const missing = states.filter((state) => typeof loaded.lines[state] !== 'string');
  if (missing.length > 0) throw new Error(`${relativePath} lines is missing: ${missing.join(', ')}`);
  return loaded;
}

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

function createTray(imagePath, name) {
  const trayIcon = new Tray(nativeImage.createFromPath(imagePath).resize({ width: 16, height: 16 }));
  trayIcon.setToolTip(name);
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
  showStatus({ state: event.state, line: character.lines[event.state], source: event.source, message: event.message });
  if (event.state === 'done') {
    idleTimer = setTimeout(() => handleEvent({ source: event.source, state: 'idle', message: '' }), config.doneToIdleSeconds * 1000);
  }
}

app.whenReady().then(() => {
  const imagePath = resolveProjectPath(character.image);
  mainWindow = createWindow(config.window);
  tray = createTray(imagePath, character.name);
  mainWindow.webContents.on('did-finish-load', () => {
    showStatus({ state: 'idle', line: character.startupLine, source: 'sidekick', message: '', image: pathToFileURL(imagePath).href });
    startStatusServer(config.server.host, config.server.port, config.states, handleEvent);
    startClaudeDesktopAdapter(config.claudeDesktop, handleEvent);
  });
});
