import { createApp, type App } from 'vue';
import FloatingPanel from './FloatingPanel.vue';
import { fetchWordInfo, type WordInfo } from './api';
import { addWordToFavorites, removeWordFromFavorites, isWordFavorited } from './storage';
import '@arco-design/web-vue/dist/arco.css';
import './style.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  
  async main() {
    console.log('Translator content script loaded');

    // 创建面板容器
    const container = document.createElement('div');
    container.id = 'translator-floating-panel';
    document.body.appendChild(container);

    // 面板状态
    let panelVisible = false;
    let currentWordInfo: WordInfo | null = null;
    let isLoading = false;
    let panelPosition = { x: 0, y: 0 };
    let vueApp: App | null = null;

    // 创建Vue应用
    const createPanel = () => {
      if (vueApp) {
        vueApp.unmount();
      }

      vueApp = createApp(FloatingPanel, {
        visible: panelVisible,
        position: panelPosition,
        wordInfo: currentWordInfo,
        loading: isLoading,
        onClose: () => {
          hidePanel();
        },
        onToggleFavorite: async (word: string, phonetics?: { us?: string; uk?: string }) => {
          const favorited = await isWordFavorited(word);
          if (favorited) {
            await removeWordFromFavorites(word);
          } else {
            await addWordToFavorites(word, phonetics);
          }
          // 重新渲染以更新收藏状态
          updatePanel();
        },
      });

      vueApp.mount(container);
    };

    // 更新面板
    const updatePanel = () => {
      createPanel();
    };

    // 显示提示消息
    const showToast = (message: string) => {
      const toast = document.createElement('div');
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 999999;
        animation: fadeIn 0.3s ease-out;
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    };

    // 显示面板
    const showPanel = async (text: string, x: number, y: number) => {
      const trimmedText = text.trim();
      
      // 只处理单词（不包含空格的文本，长度在1-50之间）
      if (!trimmedText || trimmedText.includes(' ') || trimmedText.length > 50) {
        return;
      }

      // 检查是否为英文单词
      if (!/^[a-zA-Z-']+$/.test(trimmedText)) {
        return;
      }

      // 先获取单词信息
      const wordInfo = await fetchWordInfo(trimmedText);
      
      // 如果未找到单词，显示提示并返回
      if (!wordInfo) {
        showToast(`未找到单词"${trimmedText}"的释义`);
        return;
      }

      // 调整面板位置，确保不超出屏幕
      const panelWidth = 400;
      const panelHeight = 400;
      let adjustedX = x + 10;
      let adjustedY = y + 10;

      if (adjustedX + panelWidth > window.innerWidth) {
        adjustedX = x - panelWidth - 10;
      }
      if (adjustedY + panelHeight > window.innerHeight) {
        adjustedY = y - panelHeight - 10;
      }

      adjustedX = Math.max(10, adjustedX);
      adjustedY = Math.max(10, adjustedY);

      panelPosition = { x: adjustedX, y: adjustedY };
      panelVisible = true;
      isLoading = false;
      currentWordInfo = wordInfo;

      updatePanel();
    };

    // 隐藏面板
    const hidePanel = () => {
      panelVisible = false;
      currentWordInfo = null;
      updatePanel();
    };

    // 监听文本选择
    const handleMouseUp = (e: MouseEvent) => {
      // 如果点击在面板上，不处理
      if (container.contains(e.target as Node)) {
        return;
      }

      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0) {
        showPanel(text, e.clientX, e.clientY);
      } else {
        // 如果没有选中文本，隐藏面板
        hidePanel();
      }
    };

    // 监听Esc键关闭面板
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && panelVisible) {
        hidePanel();
      }
    };

    // 添加事件监听
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    // 初始化面板（隐藏状态）
    createPanel();
  },
});
