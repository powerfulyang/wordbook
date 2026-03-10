import { defineConfig } from 'wxt';
import UnoCSS from 'unocss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  vite: () => ({
    plugins: [
      UnoCSS(),
    ],
  }),
  manifest: {
    permissions: ['storage'],
    host_permissions: ['<all_urls>']
  },
});
