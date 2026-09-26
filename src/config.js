const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.join(__dirname, '..');

function loadConfig(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), 'utf8'));
}

function resolveProjectPath(relativePath) {
  return path.join(rootDir, relativePath);
}

function expandEnvPath(value) {
  return path.normalize(value.replace(/%([^%]+)%/g, (match, name) => {
    if (process.env[name] === undefined) throw new Error(`Environment variable ${name} is not set`);
    return process.env[name];
  }));
}

module.exports = { loadConfig, resolveProjectPath, expandEnvPath };
