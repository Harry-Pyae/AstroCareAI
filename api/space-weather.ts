import { fetchSpaceWeather } from '../server/donki.ts';
import { createSpaceWeatherHandler } from '../server/endpoint.ts';

// Vercel's Node.js Web handlers need no listener, SDK or browser-visible key.
// Match Origin to the actual deployment URL, including Preview/custom domains.
const handle = createSpaceWeatherHandler({
  load: () => fetchSpaceWeather(process.env.NASA_API_KEY ?? ''),
});

export const GET = handle;
export const OPTIONS = handle;
// Preserve the local endpoint's explicit JSON 405 for unsupported methods.
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
