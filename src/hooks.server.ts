import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';

let platform: App.Platform | undefined;

export const handle: Handle = async ({ event, resolve }) => {
  if (dev) {
    if (!platform) {
      const { getPlatformProxy } = await import('wrangler');
      const proxy = await getPlatformProxy();
      platform = proxy as unknown as App.Platform;
    }
    event.platform = platform;
  }
  return resolve(event);
};
