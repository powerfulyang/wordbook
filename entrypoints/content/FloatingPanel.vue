<template>
  <div v-if="visible" ref="panelRef" class="wordbook-panel" :style="panelStyle">
    <!-- 加载状态 -->
    <div v-if="loading" class="state-view">
      <div class="arco-spinner"></div>
      <span class="state-text">查询中...</span>
    </div>

    <!-- 内容 -->
    <div v-else-if="wordInfo" class="panel-main">
      <!-- 标题栏 -->
      <div class="panel-header">
        <h2 class="word-text" :class="{ 'is-sentence': isSentence }">{{ wordInfo.word }}</h2>
        <div class="header-actions">
          <button class="action-btn btn-star" :class="{ favorited: isFavorited }" @click="handleToggleFavorite"
            title="收藏">
            <IconStarFill v-if="isFavorited" :size="16" />
            <IconStar v-else :size="16" />
          </button>
          <button class="action-btn btn-close" @click="handleClose" title="关闭">
            <IconClose :size="14" />
          </button>
        </div>
      </div>

      <!-- 音标和发音 (如果是单词) -->
      <div v-if="!isSentence && showPhonetics && (wordInfo.phonetics?.us || wordInfo.phonetics?.uk)"
        class="phonetics-row">
        <div v-if="wordInfo.phonetics.us" class="phonetic-item" :class="{ 'is-playing': playingType === 'us' }"
          @click="playAudio('us')" title="播放美式发音">
          <span class="ph-label us-label">US</span>
          <span class="ph-text">/{{ wordInfo.phonetics.us }}/</span>
          <IconSound class="ph-icon" :size="14" />
        </div>
        <div v-if="wordInfo.phonetics.uk" class="phonetic-item" :class="{ 'is-playing': playingType === 'uk' }"
          @click="playAudio('uk')" title="播放英式发音">
          <span class="ph-label uk-label">UK</span>
          <span class="ph-text">/{{ wordInfo.phonetics.uk }}/</span>
          <IconSound class="ph-icon" :size="14" />
        </div>
      </div>

      <!-- 句子发音 (如果是句子) -->
      <div v-if="isSentence" class="phonetics-row">
        <div class="phonetic-item sentence-tts" :class="{ 'is-playing': playingType === 'tts' }"
          @click="playAudio('tts')" title="朗读句子">
          <span class="ph-label us-label">朗读</span>
          <span class="ph-text">Edge TTS</span>
          <IconSound class="ph-icon" :size="14" />
        </div>
      </div>

      <!-- 分割线 -->
      <div class="panel-divider"></div>

      <!-- 翻译 -->
      <div class="translations-box">
        <template v-if="wordInfo.translations && wordInfo.translations.length > 0">
          <div v-for="(trans, idx) in wordInfo.translations.slice(0, 5)" :key="idx" class="trans-item">
            <span class="trans-dot"></span>
            <span class="trans-text">{{ trans }}</span>
          </div>
        </template>
        <div v-else class="empty-state">
          暂无释义
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else class="state-view">
      <span class="state-text">未找到单词信息 😔</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { IconSound, IconStar, IconStarFill, IconClose } from '@arco-design/web-vue/es/icon';
import type { WordInfo } from './api';
import { fetchWordInfo, playUnifiedAudio, stopUnifiedAudio, translateSentence } from './api';
import {
  getUserSettings,
  addWordToHistory,
  addWordToFavorites,
  removeWordFromFavorites,
  isWordFavorited,
  type UserSettings
} from './storage';
import './style.css';

// 内部状态
const visible = ref(false);
const position = ref({ x: 0, y: 0 });
const wordInfo = ref<WordInfo | null>(null);
const loading = ref(false);

const panelRef = ref<HTMLElement>();
const settings = ref<UserSettings | null>(null);
const isFavorited = ref(false);
// 音频对象状态
const playingType = ref<'us' | 'uk' | 'tts' | null>(null);
const isSentence = ref(false);

const showPhonetics = computed(() => settings.value?.showPhonetics ?? true);

const panelStyle = computed(() => {
  return {
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
  };
});

// 预加载音频 (弃用，由 playUnifiedAudio 内部处理)
const preloadAudio = (word: string) => {
};

// 播放音频
const playAudio = (type: 'us' | 'uk' | 'tts') => {
  if (!wordInfo.value) return;

  playingType.value = type;

  playUnifiedAudio(wordInfo.value.word, type, {
    volume: settings.value?.volume ?? 0.8,
    defaultVoice: settings.value?.defaultVoice === 'uk' ? 'uk' : 'us',
    onStart: () => {
      playingType.value = type;
    },
    onEnded: () => {
      playingType.value = null;
    }
  });
};

// 切换收藏
const handleToggleFavorite = async () => {
  if (!wordInfo.value) return;

  if (isFavorited.value) {
    await removeWordFromFavorites(wordInfo.value.word);
  } else {
    await addWordToFavorites(wordInfo.value.word, wordInfo.value.phonetics);
  }
  isFavorited.value = !isFavorited.value;
};

// 关闭面板
const handleClose = () => {
  stopUnifiedAudio();
  playingType.value = null;

  visible.value = false;
  wordInfo.value = null;
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

  if (!trimmedText) {
    return;
  }

  // 正在加载时占位对齐面板位置
  const panelWidth = 350; // 预估宽度，用于位置调整
  const panelHeight = 200; // 预估高度
  let adjustedX = x + 12;
  let adjustedY = y + 15;

  // 确保面板不会超出窗口边界
  if (adjustedX + panelWidth > window.innerWidth) {
    adjustedX = x - panelWidth - 10;
  }
  if (adjustedY + panelHeight > window.innerHeight) {
    adjustedY = y - panelHeight - 10;
  }

  adjustedX = Math.max(10, adjustedX);
  adjustedY = Math.max(10, adjustedY);

  position.value = { x: adjustedX, y: adjustedY };

  loading.value = true;
  visible.value = true;

  // 获取单词信息
  let info = await fetchWordInfo(trimmedText);
  const isMultiWord = trimmedText.includes(' ');

  // 如果未找到单词，但它是句子，则启用句子模式
  if (!info) {
    if (isMultiWord || trimmedText.length > 20) {
      const aiTranslation = await translateSentence(trimmedText);
      info = {
        word: trimmedText,
        translations: aiTranslation ? [aiTranslation] : ['使用 Edge TTS 朗读该句子。'],
        translationSource: aiTranslation ? 'ai' : 'dict'
      };
      isSentence.value = true;
    } else {
      loading.value = false;
      showToast(`未找到单词"${trimmedText}"的释义`);
      visible.value = false;
      return;
    }
  } else {
    isSentence.value = false;
  }

  loading.value = false;
  wordInfo.value = info;
};

// 监听单词变化
watch(wordInfo, async (newInfo) => {
  if (newInfo) {
    // 预加载音频
    preloadAudio(newInfo.word);

    // 添加到历史记录
    await addWordToHistory(newInfo.word);

    // 检查是否已收藏
    isFavorited.value = await isWordFavorited(newInfo.word);

    // 自动播放
    if (settings.value?.autoPlay) {
      setTimeout(() => {
        const voiceType = settings.value?.defaultVoice || 'us';
        playAudio(voiceType);
      }, 300);
    }
  }
});

// 监听文本选择
const handleMouseUp = (e: MouseEvent) => {
  if (visible.value && panelRef.value) {
    const rootNode = panelRef.value.getRootNode() as ShadowRoot | Document;
    const shadowHost = rootNode instanceof ShadowRoot ? rootNode.host : null;

    // 如果我们点击的是 shadowHost 或者 panel 本身，不处理
    if (e.composedPath().includes(panelRef.value) || (shadowHost && e.composedPath().includes(shadowHost))) {
      return;
    }
  }

  const selection = window.getSelection();
  const text = selection?.toString().trim();

  console.log('Selected text:', text , 'length:', text?.length);

  if (text && text.length > 0) {
    showPanel(text, e.clientX, e.clientY);
  } else {
    handleClose();
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && visible.value) {
    handleClose();
  }
};

onMounted(async () => {
  settings.value = await getUserSettings();
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('keydown', handleKeyDown);

  // 清理当前播放的音频
  stopUnifiedAudio();
  playingType.value = null;
});
</script>

<style scoped>
.wordbook-panel {
  position: fixed;
  z-index: 999999;
  min-width: 280px;
  max-width: 480px;
  width: fit-content;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #1f2937;
  overflow: hidden;
  animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top left;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(4px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 状态视图 (加载/错误) */
.state-view {
  padding: 32px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.arco-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spinner 0.8s linear infinite;
}

@keyframes spinner {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.state-text {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

/* 主内容区域 */
.panel-main {
  padding: 16px 20px;
}

/* 标题区 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.word-text {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  line-height: 1.25;
  word-break: break-word;
  padding-right: 12px;
}

.word-text.is-sentence {
  font-weight: normal;
  font-size: 15px;
}

.header-actions {
  display: flex;
  gap: 6px;
  margin-top: 1px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.action-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.btn-star.favorited {
  color: #eab308;
  background: #fef9c3;
}

.btn-star.favorited:hover {
  background: #fef08a;
}

/* 音标区 */
.phonetics-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.phonetic-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  border: 1px solid transparent;
}

.phonetic-item:hover {
  background: #f9fafb;
  border-color: #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.phonetic-item:active {
  transform: translateY(1px);
  box-shadow: none;
}

.phonetic-item.is-playing {
  background: #eff6ff;
  border-color: #bfdbfe;
  box-shadow: inset 0 0 0 1px #bfdbfe, 0 1px 2px rgba(59, 130, 246, 0.05);
}

@keyframes playing-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  100% {
    transform: scale(0.85);
    opacity: 0.8;
  }
}

.phonetic-item.is-playing .ph-icon {
  color: #3b82f6;
  animation: playing-pulse 0.6s ease-in-out infinite alternate;
}

.sentence-tts {
  flex-direction: row;
  justify-content: center;
}

.ph-label {
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  padding: 2px 4px;
  border-radius: 4px;
  line-height: 1;
  letter-spacing: 0.5px;
}

.us-label {
  background: #3b82f6;
}

.uk-label {
  background: #8b5cf6;
}

.ph-text {
  font-size: 13px;
  color: #4b5563;
  font-family: "Lucida Sans Unicode", "Arial Unicode MS", span;
  padding-bottom: 1px;
}

.ph-icon {
  color: #9ca3af;
}

.phonetic-item:hover .ph-icon {
  color: #4b5563;
}

/* 分割线 */
.panel-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e5e7eb 10%, #e5e7eb 90%, transparent);
  margin: 0 0 12px;
}

/* 翻译区 */
.translations-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trans-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.trans-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #3b82f6;
  margin-top: 8px;
  flex-shrink: 0;
  opacity: 0.6;
}

.trans-text {
  font-size: 14px;
  line-height: 1.5;
  color: #374151;
}

.empty-state {
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
  padding: 8px 0;
}
</style>
