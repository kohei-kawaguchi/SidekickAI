const { loadConfig } = require('../src/config');

const config = loadConfig('config/sidekick.json');

function readHookInput(onInput) {
  let raw = '';
  process.stdin.on('data', (chunk) => { raw += chunk; });
  process.stdin.on('end', () => onInput(JSON.parse(raw)));
}

function postEvent(source, state, message) {
  return fetch(`http://${config.server.host}:${config.server.port}/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, state, message: message.slice(0, config.hooks.messageMaxLength) }),
    signal: AbortSignal.timeout(config.hooks.requestTimeoutMs),
  });
}

module.exports = { config, readHookInput, postEvent };
