const path = require('node:path');
const fs = require('node:fs');
const { app, BrowserWindow } = require('electron');

const [svgPath, pngPath, width, height] = process.argv.slice(-4);

app.whenReady().then(() => {
  const window = new BrowserWindow({ width: Number(width), height: Number(height), show: false, transparent: true, frame: false, useContentSize: true, webPreferences: { offscreen: true } });
  window.webContents.once('paint', (event, dirty, image) => {
    fs.writeFileSync(pngPath, image.toPNG());
    app.quit();
  });
  window.loadFile(path.resolve(svgPath));
});
