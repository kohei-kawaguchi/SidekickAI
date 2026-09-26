const { loadConfig } = require('../../src/config');

const config = loadConfig('config/sidekick.json');

function messageFor(input, maxLength) {
  if (input.hook_event_name === 'stop') return input.status;
  if (input.hook_event_name === 'afterAgentResponse') return input.text.slice(0, maxLength);
  return '';
}

let raw = '';
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', async () => {
  const input = JSON.parse(raw);
  const eventName = input.hook_event_name;
  process.stdout.write(JSON.stringify(config.cursor.eventResponses[eventName] ?? {}));
  const state = config.cursor.eventStates[eventName];
  if (state === undefined) return;
  await fetch(`http://${config.server.host}:${config.server.port}/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'Cursor', state, message: messageFor(input, config.cursor.messageMaxLength) }),
    signal: AbortSignal.timeout(config.cursor.requestTimeoutMs),
  });
});
