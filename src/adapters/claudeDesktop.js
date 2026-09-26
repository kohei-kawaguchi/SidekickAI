const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const { expandEnvPath } = require('../config');

const SOURCE = 'Claude';

function toastTexts(payload) {
  return [...Buffer.from(payload).toString('utf8').matchAll(/<text>([\s\S]*?)<\/text>/g)].map((match) => match[1]);
}

function startNotificationWatcher(config, onEvent) {
  const db = new DatabaseSync(expandEnvPath(config.notificationDb), { readOnly: true });
  const handler = db.prepare('SELECT RecordId FROM NotificationHandler WHERE PrimaryId = ?').get(config.notificationHandler);
  if (handler === undefined) throw new Error(`Notification handler ${config.notificationHandler} not found`);
  const latest = db.prepare('SELECT MAX("Order") AS maxOrder FROM Notification').get();
  let lastOrder = latest.maxOrder;
  const query = db.prepare('SELECT "Order" AS ord, Tag AS tag, Payload AS payload FROM Notification WHERE HandlerId = ? AND "Order" > ? ORDER BY "Order"');
  return () => {
    for (const row of query.all(handler.RecordId, lastOrder)) {
      lastOrder = row.ord;
      const rule = config.notificationTagRules.find((candidate) => row.tag.startsWith(candidate.prefix));
      if (rule === undefined) continue;
      const texts = toastTexts(row.payload);
      onEvent({ source: SOURCE, state: rule.state, message: texts.slice(1).join(' ') });
    }
  };
}

function startLogWatcher(config, onEvent) {
  const logPath = expandEnvPath(config.mainLog);
  const rules = config.logRules.map((rule) => ({ regex: new RegExp(rule.pattern), state: rule.state }));
  let offset = fs.statSync(logPath).size;
  let remainder = '';
  return () => {
    const size = fs.statSync(logPath).size;
    if (size < offset) {
      offset = 0;
      remainder = '';
    }
    if (size === offset) return;
    const fd = fs.openSync(logPath, 'r');
    const buffer = Buffer.alloc(size - offset);
    fs.readSync(fd, buffer, 0, buffer.length, offset);
    fs.closeSync(fd);
    offset = size;
    const lines = (remainder + buffer.toString('utf8')).split(/\r?\n/);
    remainder = lines.pop();
    for (const line of lines) {
      const rule = rules.find((candidate) => candidate.regex.test(line));
      if (rule !== undefined) onEvent({ source: SOURCE, state: rule.state, message: '' });
    }
  };
}

function startClaudeDesktopAdapter(config, onEvent) {
  const pollNotifications = startNotificationWatcher(config, onEvent);
  const pollLog = startLogWatcher(config, onEvent);
  return setInterval(() => {
    pollLog();
    pollNotifications();
  }, config.pollSeconds * 1000);
}

module.exports = { startClaudeDesktopAdapter };
