<template>
  <div 
    v-if="visible"
    ref="panelRef"
    class="floating-panel"
    :class="`theme-${theme}`"
    :style="panelStyle"
  >
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>查询中...</span>
    </div>

    <!-- 内容 -->
    <div v-else-if="wordInfo" class="panel-content">
      <!-- 标题栏 -->
      <div class="panel-header">
        <div class="word-title">{{ wordInfo.word }}</div>
        <div class="header-actions">
          <button 
            class="icon-btn favorite-btn"
            :class="{ favorited: isFavorited }"
            @click="handleToggleFavorite"
            title="收藏"
          >
            <IconStarFill v-if="isFavorited" :size="16" />
            <IconStar v-else :size="16" />
          </button>
          <button class="icon-btn close-btn" @click="handleClose" title="关闭">
            <IconClose :size="16" />
          </button>
        </div>
      </div>

      <!-- 音标和发音 -->
      <div v-if="showPhonetics && (wordInfo.phonetics?.us || wordInfo.phonetics?.uk)" class="phonetics-block">
        <div class="phonetics-container">
          <div v-if="wordInfo.phonetics.us" class="phonetic-row">
            <div class="phonetic-info">
              <span class="region-label">美</span>
              <span class="phonetic-text">/{{ wordInfo.phonetics.us }}/</span>
            </div>
            <button class="play-button" @click="playAudio('us')" title="播放美式发音">
              <IconSound :size="16" />
            </button>
          </div>
          <div v-if="wordInfo.phonetics.uk" class="phonetic-row">
            <div class="phonetic-info">
              <span class="region-label">英</span>
              <span class="phonetic-text">/{{ wordInfo.phonetics.uk }}/</span>
            </div>
            <button class="play-button" @click="playAudio('uk')" title="播放英式发音">
              <IconSound :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- 翻译 -->
      <div class="translations-section">
        <div v-if="wordInfo.translations && wordInfo.translations.length > 0" class="translation-list">
          <div v-for="(trans, idx) in wordInfo.translations.slice(0, 5)" :key="idx" class="translation-item">
            {{ trans }}
          </div>
        </div>
        <div v-else class="no-translation">
          暂无释义
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-state">
      <span>未找到单词信息</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { IconSound, IconStar, IconStarFill, IconClose } from '@arco-design/web-vue/es/icon';
import type { WordInfo } from './api';
import { playWordAudio } from './api';
import { 
  getUserSettings, 
  addWordToHistory,
  addWordToFavorites,
  removeWordFromFavorites,
  isWordFavorited,
  type UserSettings
} from './storage';

const props = defineProps<{
  visible: boolean;
  position: { x: number; y: number };
  wordInfo: WordInfo | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  close: [];
  toggleFavorite: [word: string, phonetics?: { us?: string; uk?: string }];
}>();

const panelRef = ref<HTMLElement>();
const settings = ref<UserSettings | null>(null);
const isFavorited = ref(false);
const currentAudio = ref<HTMLAudioElement | null>(null);
// 预加载的音频对象
const preloadedUsAudio = ref<HTMLAudioElement | null>(null);
const preloadedUkAudio = ref<HTMLAudioElement | null>(null);

const theme = computed(() => settings.value?.theme || 'purple');
const showPhonetics = computed(() => settings.value?.showPhonetics ?? true);

const panelStyle = computed(() => {
  return {
    left: `${props.position.x}px`,
    top: `${props.position.y}px`,
  };
});

// 预加载音频
const preloadAudio = (word: string) => {
  // 清理旧的预加载音频
  if (preloadedUsAudio.value) {
    preloadedUsAudio.value.pause();
    preloadedUsAudio.value = null;
  }
  if (preloadedUkAudio.value) {
    preloadedUkAudio.value.pause();
    preloadedUkAudio.value = null;
  }
  
  const volume = settings.value?.volume ?? 0.8;
  
  // 预加载美式发音
  const usAudioUrl = `https://dict.youdao.com/dictvoice?type=0&audio=${encodeURIComponent(word)}`;
  preloadedUsAudio.value = new Audio(usAudioUrl);
  preloadedUsAudio.value.volume = volume;
  preloadedUsAudio.value.preload = 'auto';
  
  // 预加载英式发音
  const ukAudioUrl = `https://dict.youdao.com/dictvoice?type=1&audio=${encodeURIComponent(word)}`;
  preloadedUkAudio.value = new Audio(ukAudioUrl);
  preloadedUkAudio.value.volume = volume;
  preloadedUkAudio.value.preload = 'auto';
};

// 播放音频
const playAudio = (type: 'us' | 'uk') => {
  if (!props.wordInfo) return;
  
  // 停止当前播放
  if (currentAudio.value) {
    currentAudio.value.pause();
    currentAudio.value.currentTime = 0;
  }
  
  // 使用预加载的音频或创建新的
  const audioToPlay = type === 'us' ? preloadedUsAudio.value : preloadedUkAudio.value;
  
  if (audioToPlay) {
    audioToPlay.currentTime = 0;
    audioToPlay.play().catch(err => {
      console.error('播放失败:', err);
    });
    currentAudio.value = audioToPlay;
  } else {
    // 如果预加载失败，使用原来的方式
    const volume = settings.value?.volume ?? 0.8;
    currentAudio.value = playWordAudio(props.wordInfo.word, type, volume);
  }
};

// 切换收藏
const handleToggleFavorite = async () => {
  if (!props.wordInfo) return;
  
  emit('toggleFavorite', props.wordInfo.word, props.wordInfo.phonetics);
  isFavorited.value = !isFavorited.value;
};

// 关闭面板
const handleClose = () => {
  // 停止当前播放
  if (currentAudio.value) {
    currentAudio.value.pause();
    currentAudio.value = null;
  }
  
  // 清理预加载的音频
  if (preloadedUsAudio.value) {
    preloadedUsAudio.value.pause();
    preloadedUsAudio.value = null;
  }
  if (preloadedUkAudio.value) {
    preloadedUkAudio.value.pause();
    preloadedUkAudio.value = null;
  }
  
  emit('close');
};

// 监听单词变化
watch(() => props.wordInfo, async (newInfo) => {
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

// 点击外部关闭
const handleClickOutside = (e: MouseEvent) => {
  if (props.visible && panelRef.value && !panelRef.value.contains(e.target as Node)) {
    handleClose();
  }
};

onMounted(async () => {
  settings.value = await getUserSettings();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  
  // 清理当前播放的音频
  if (currentAudio.value) {
    currentAudio.value.pause();
    currentAudio.value = null;
  }
  
  // 清理预加载的音频
  if (preloadedUsAudio.value) {
    preloadedUsAudio.value.pause();
    preloadedUsAudio.value = null;
  }
  if (preloadedUkAudio.value) {
    preloadedUkAudio.value.pause();
    preloadedUkAudio.value = null;
  }
});
</script>

<style scoped>
.floating-panel {
  position: fixed;
  z-index: 999999;
  min-width: 320px;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
  animation: fadeInUp 0.2s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 主题颜色 */
.floating-panel.theme-purple {
  --theme-color: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --theme-light: rgba(102, 126, 234, 0.1);
  --theme-solid: #667eea;
}

.floating-panel.theme-blue {
  --theme-color: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  --theme-light: rgba(79, 172, 254, 0.1);
  --theme-solid: #4facfe;
}

.floating-panel.theme-green {
  --theme-color: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  --theme-light: rgba(67, 233, 123, 0.1);
  --theme-solid: #43e97b;
}

/* 加载状态 */
.loading-state {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #666;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--theme-solid);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 面板内容 */
.panel-content {
  padding: 0;
}

/* 标题栏 */
.panel-header {
  background: var(--theme-color);
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.word-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.favorite-btn.favorited {
  background: rgba(255, 215, 0, 0.3);
  color: #ffd700;
}

/* 音标区域 */
.phonetics-block {
  padding: 12px 16px;
  background: #fafbfc;
  border-bottom: 1px solid #e8e8e8;
}

.phonetics-container {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.phonetic-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  gap: 10px;
}

.phonetic-row:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 6px;
  padding-bottom: 8px;
}

.phonetic-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.region-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 20px;
  padding: 0 6px;
  background: var(--theme-light);
  color: var(--theme-solid);
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  flex-shrink: 0;
}

.phonetic-text {
  flex: 1;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  color: #1d2129;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.4;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.play-button {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-light);
  color: var(--theme-solid);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.play-button:hover {
  background: var(--theme-solid);
  color: white;
  transform: scale(1.08);
}

.play-button:active {
  transform: scale(0.95);
}

/* 翻译区域 */
.translations-section {
  padding: 12px 16px;
}

.translation-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.translation-item {
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  color: #333;
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.2s;
}

.translation-item:hover {
  background: #e8e9ea;
}

.no-translation {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

/* 错误状态 */
.error-state {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}
</style>

