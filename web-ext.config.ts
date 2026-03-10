import { resolve } from 'node:path';
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  // On Windows, the path must be absolute
  chromiumProfile: resolve('.wxt/chrome-data'),
  chromiumArgs: ['--start-maximized'],
  keepProfileChanges: true,
  startUrls: ['https://www.bbc.co.uk/learningenglish/english/features/the_pronunciation_lounge/episode_16'],
});