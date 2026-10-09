import { fetchSpaceWeather } from './donki.ts';
import { createProxyServer } from './http.ts';

const port = Number(process.env.SERVER_PORT || 3001);
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5181';
if (!Number.isInteger(port) || port < 1024 || port > 65535 || !/^https?:\/\//.test(frontendOrigin) || new URL(frontendOrigin).origin !== frontendOrigin) {
  console.error('Invalid SERVER_PORT or FRONTEND_ORIGIN configuration.');
  process.exit(1);
}
const server = createProxyServer({ frontendOrigin, load: () => fetchSpaceWeather(process.env.NASA_API_KEY ?? '') });
server.on('error', () => { console.error('Proxy could not start; check server port availability.'); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`ASTROCARE proxy listening on http://127.0.0.1:${port}`));
