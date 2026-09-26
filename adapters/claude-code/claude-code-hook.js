const path = require('node:path');
const { config, readHookInput, postEvent } = require('../hook-client');

function messageFor(input) {
  if (input.hook_event_name === 'Notification') return input.message;
  return '';
}

readHookInput(async (input) => {
  const state = config.claudeCode.eventStates[input.hook_event_name];
  if (state === undefined) return;
  await postEvent(`Claude Code (${path.basename(input.cwd)})`, state, messageFor(input));
});
