import { createApp, type App } from 'vue';
import FloatingPanel from './FloatingPanel.vue';
import '@arco-design/web-vue/dist/arco.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  
  async main(ctx) {
    console.log('Translator content script loaded');

    // 创建Shadow Root UI
    const ui = await createShadowRootUi(ctx, {
      name: 'translator-floating-panel',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: (container: HTMLElement) => {
        const app = createApp(FloatingPanel);
        app.mount(container);
        return app;
      },
      onRemove: (app?: App | null) => {
        app?.unmount();
      },
    });

    // 初始化面板（隐藏状态）
    ui.mount();
  },
});
