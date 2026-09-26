const { config, readHookInput, postEvent } = require('../hook-client');

function messageFor(input) {
  if (input.hook_event_name === 'stop') return input.status;
  if (input.hook_event_name === 'afterAgentResponse') return input.text;
  return '';
}

readHookInput(async (input) => {
  const eventName = input.hook_event_name;
  process.stdout.write(JSON.stringify(config.cursor.eventResponses[eventName] ?? {}));
  const state = config.cursor.eventStates[eventName];
  if (state === undefined) return;
  await postEvent('Cursor', state, messageFor(input));
});
