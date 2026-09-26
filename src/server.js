const http = require('node:http');

function startStatusServer(host, port, validStates, onEvent) {
  const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/event') {
      res.writeHead(404).end();
      return;
    }
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const event = JSON.parse(body);
      if (!validStates.includes(event.state) || typeof event.source !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: `state must be one of ${validStates.join(', ')} and source must be a string` }));
        return;
      }
      onEvent({ source: event.source, state: event.state, message: typeof event.message === 'string' ? event.message : '' });
      res.writeHead(204).end();
    });
  });
  server.listen(port, host);
  return server;
}

module.exports = { startStatusServer };
