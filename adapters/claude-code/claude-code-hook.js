const path = require('node:path');
const { loadConfig } = require('../../src/config');

const config = loadConfig('config/sidekick.json');

function messageFor(input) {
  if (input.hook_event_name === 'Notification') return input.message;
  return '';
}

let raw = '';
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', async () => {
  const input = JSON.parse(raw);
  const state = config.claudeCode.eventStates[input.hook_event_name];
  if (state === undefined) return;
  await fetch(`http://${config.server.host}:${config.server.port}/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: `Claude Code (${path.basename(input.cwd)})`, state, message: messageFor(input).slice(0, config.claudeCode.messageMaxLength) }),
    signal: AbortSignal.timeout(config.claudeCode.requestTimeoutMs),
  });
});
