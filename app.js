const { createServer } = require('node:http');
const { parse } = require('node:url');
const next = require('next');

const port = Number.parseInt(process.env.PORT || '3000', 10);
const app = next({ dev: false, hostname: '0.0.0.0', port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (request, response) => {
    try {
      await handle(request, response, parse(request.url, true));
    } catch (error) {
      console.error('Request failed', error);
      response.statusCode = 500;
      response.end('Internal Server Error');
    }
  }).listen(port, '0.0.0.0');
});
