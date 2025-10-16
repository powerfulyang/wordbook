<template>
  <div class="popup-container">
    <div class="header">
      <h1>🎯 划词翻译设置</h1>
      <p class="subtitle">个性化您的翻译体验</p>
    </div>

    <a-spin :loading="!settings" class="loading-wrapper">
      <div v-if="settings" class="settings-content">
        <!-- 自动播放设置 -->
        <a-card class="setting-card" :bordered="false">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-icon">🔊</div>
              <div class="setting-details">
                <div class="setting-label">自动播放发音</div>
                <div class="setting-desc">选中单词后自动播放发音</div>
              </div>
            </div>
            <a-switch 
              v-model="settings.autoPlay"
              @change="handleSave"
            />
          </div>
        </a-card>

        <!-- 默认发音设置 -->
        <a-card class="setting-card" :bordered="false">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-icon">🌐</div>
              <div class="setting-details">
                <div class="setting-label">默认发音</div>
                <div class="setting-desc">自动播放时使用的发音类型</div>
              </div>
            </div>
            <a-radio-group 
              v-model="settings.defaultVoice"
              @change="handleSave"
              type="button"
            >
              <a-radio value="us">🇺🇸 美音</a-radio>
              <a-radio value="uk">🇬🇧 英音</a-radio>
            </a-radio-group>
          </div>
        </a-card>

        <!-- 音标显示设置 -->
        <a-card class="setting-card" :bordered="false">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-icon">📖</div>
              <div class="setting-details">
                <div class="setting-label">显示音标</div>
                <div class="setting-desc">在面板中显示国际音标</div>
              </div>
            </div>
            <a-switch 
              v-model="settings.showPhonetics"
              @change="handleSave"
            />
          </div>
        </a-card>

        <!-- 主题设置 -->
        <a-card class="setting-card" :bordered="false">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-icon">🎨</div>
              <div class="setting-details">
                <div class="setting-label">主题颜色</div>
                <div class="setting-desc">选择浮动面板的主题</div>
              </div>
            </div>
            <a-space>
              <a-button 
                :type="settings.theme === 'purple' ? 'primary' : 'outline'"
                @click="changeTheme('purple')"
                class="theme-btn theme-purple"
              >
                紫色
              </a-button>
              <a-button 
                :type="settings.theme === 'blue' ? 'primary' : 'outline'"
                @click="changeTheme('blue')"
                class="theme-btn theme-blue"
              >
                蓝色
              </a-button>
              <a-button 
                :type="settings.theme === 'green' ? 'primary' : 'outline'"
                @click="changeTheme('green')"
                class="theme-btn theme-green"
              >
                绿色
              </a-button>
            </a-space>
          </div>
        </a-card>

        <!-- 音量设置 -->
        <a-card class="setting-card" :bordered="false">
          <div class="setting-item-column">
            <div class="setting-info">
              <div class="setting-icon">🔉</div>
              <div class="setting-details">
                <div class="setting-label">音量</div>
                <div class="setting-desc">{{ Math.round(settings.volume * 100) }}%</div>
              </div>
            </div>
            <a-slider 
              v-model="settings.volume"
              :min="0"
              :max="1"
              :step="0.1"
              @change="handleSave"
              :show-tooltip="false"
            />
          </div>
        </a-card>

        <!-- 历史记录 -->
        <a-card class="setting-card" :bordered="false">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-icon">📚</div>
              <div class="setting-details">
                <div class="setting-label">查询历史</div>
                <div class="setting-desc">已保存 {{ settings.wordHistory.length }} 个单词</div>
              </div>
            </div>
            <a-button type="outline" @click="handleClearHistory">
              清空历史
            </a-button>
          </div>
        </a-card>

        <!-- 收藏单词 -->
        <a-card class="setting-card" :bordered="false">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-icon">⭐</div>
              <div class="setting-details">
                <div class="setting-label">收藏单词</div>
                <div class="setting-desc">已收藏 {{ settings.favoriteWords.length }} 个单词</div>
              </div>
            </div>
            <a-button 
              v-if="settings.favoriteWords.length > 0"
              type="outline" 
              @click="handleClearFavorites"
            >
              清空收藏
            </a-button>
          </div>
        </a-card>

        <!-- 显示收藏的单词 -->
        <a-card v-if="settings.favoriteWords.length > 0" class="favorites-card" :bordered="false">
          <template #title>
            <div class="card-title">⭐ 我的收藏</div>
          </template>
          <a-scrollbar style="max-height: 400px; overflow: auto;">
            <a-list :bordered="false">
              <a-list-item 
                v-for="(favorite, index) in settings.favoriteWords.slice(0, 50)" 
                :key="index"
                class="favorite-item"
              >
                <a-list-item-meta>
                  <template #title>
                    <div class="favorite-word">{{ favorite.word }}</div>
                  </template>
                  <template #description>
                    <div v-if="favorite.phonetics" class="favorite-phonetics">
                      <a-tag v-if="favorite.phonetics.us" color="blue" size="small">
                        🇺🇸 {{ favorite.phonetics.us }}
                      </a-tag>
                      <a-tag v-if="favorite.phonetics.uk" color="blue" size="small">
                        🇬🇧 {{ favorite.phonetics.uk }}
                      </a-tag>
                    </div>
                    <div v-if="favorite.note" class="favorite-note">{{ favorite.note }}</div>
                    <div class="favorite-time">{{ formatTime(favorite.addedTime) }}</div>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-button-group type="text" size="small">
                    <a-button 
                      @click="playWord(favorite.word, 0)"
                      title="播放美音"
                    >
                      🇺🇸
                    </a-button>
                    <a-button 
                      @click="playWord(favorite.word, 1)"
                      title="播放英音"
                    >
                      🇬🇧
                    </a-button>
                    <a-button 
                      status="danger"
                      @click="handleRemoveFavorite(favorite.word)"
                      title="移除收藏"
                    >
                      🗑️
                    </a-button>
                  </a-button-group>
                </template>
              </a-list-item>
            </a-list>
          </a-scrollbar>
        </a-card>

        <!-- 显示历史单词 -->
        <a-card v-if="settings.wordHistory.length > 0" class="history-card" :bordered="false">
          <template #title>
            <div class="card-title">📚 最近查询的单词</div>
          </template>
          <a-space wrap>
            <a-tag 
              v-for="(word, index) in settings.wordHistory.slice(0, 20)" 
              :key="index"
              color="arcoblue"
            >
              {{ word }}
            </a-tag>
          </a-space>
        </a-card>

        <!-- 重置按钮 -->
        <a-button 
          type="primary" 
          status="danger" 
          long
          @click="handleReset"
          class="reset-btn"
        >
          重置所有设置
        </a-button>
      </div>
    </a-spin>

    <div class="footer">
      <p>版本 1.0.0 | 最后使用: {{ lastUsedText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Message, Modal } from '@arco-design/web-vue';
import {
  getUserSettings,
  saveUserSettings,
  clearWordHistory,
  resetSettings,
  removeWordFromFavorites,
  clearFavorites,
  type UserSettings
} from '../content/storage';

const settings = ref<UserSettings | null>(null);
let currentAudio: HTMLAudioElement | null = null;

const lastUsedText = computed(() => {
  if (!settings.value) return '未知';
  const date = new Date(settings.value.lastUsedTime);
  return date.toLocaleString('zh-CN');
});

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return '今天';
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
};

// 播放单词发音
const playWord = (word: string, type: number) => {
  const url = `http://dict.youdao.com/dictvoice?type=${type}&audio=${encodeURIComponent(word)}`;
  
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  
  const audio = new Audio(url);
  if (settings.value) {
    audio.volume = settings.value.volume;
  }
  currentAudio = audio;
  audio.play().catch(err => {
    console.error('播放失败:', err);
    Message.error('播放失败');
  });
};

const handleSave = async () => {
  if (!settings.value) return;
  
  await saveUserSettings(settings.value);
  Message.success('设置已保存');
};

const changeTheme = async (theme: 'purple' | 'blue' | 'green') => {
  if (!settings.value) return;
  settings.value.theme = theme;
  await handleSave();
};

const handleClearHistory = () => {
  Modal.confirm({
    title: '确认清空',
    content: '确定要清空所有查询历史吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      await clearWordHistory();
      if (settings.value) {
        settings.value.wordHistory = [];
      }
      Message.success('历史记录已清空');
    }
  });
};

const handleReset = () => {
  Modal.confirm({
    title: '确认重置',
    content: '确定要重置所有设置为默认值吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      await resetSettings();
      settings.value = await getUserSettings();
      Message.success('设置已重置');
    }
  });
};

const handleRemoveFavorite = (word: string) => {
  Modal.confirm({
    title: '确认移除',
    content: `确定要移除收藏 "${word}" 吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      await removeWordFromFavorites(word);
      if (settings.value) {
        settings.value.favoriteWords = settings.value.favoriteWords.filter(
          f => f.word.toLowerCase() !== word.toLowerCase()
        );
      }
      Message.success('已移除收藏');
    }
  });
};

const handleClearFavorites = () => {
  Modal.confirm({
    title: '确认清空',
    content: '确定要清空所有收藏吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      await clearFavorites();
      if (settings.value) {
        settings.value.favoriteWords = [];
      }
      Message.success('收藏已清空');
    }
  });
};

onMounted(async () => {
  settings.value = await getUserSettings();
});
</script>

<style scoped>
.popup-container {
  width: 400px;
  min-height: 500px;
  background: var(--color-bg-1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px 20px;
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.subtitle {
  margin: 8px 0 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.loading-wrapper {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-content {
  padding: 16px;
}

.setting-card {
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.setting-item-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.setting-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.setting-details {
  flex: 1;
}

.setting-label {
  font-weight: 600;
  color: var(--color-text-1);
  font-size: 15px;
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 12px;
  color: var(--color-text-3);
}

/* 主题按钮 */
.theme-btn.theme-purple[type="primary"] {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.theme-btn.theme-blue[type="primary"] {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
}

.theme-btn.theme-green[type="primary"] {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  border: none;
}

/* 收藏和历史卡片 */
.favorites-card,
.history-card {
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.card-title {
  font-weight: 600;
  font-size: 15px;
}

.favorite-item {
  border-left: 3px solid rgb(var(--warning-6));
  padding-left: 12px;
}

.favorite-word {
  font-weight: 600;
  color: var(--color-text-1);
  font-size: 16px;
}

.favorite-phonetics {
  margin-top: 4px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.favorite-note {
  font-size: 12px;
  color: var(--color-text-3);
  font-style: italic;
  margin-top: 4px;
}

.favorite-time {
  font-size: 11px;
  color: var(--color-text-4);
  margin-top: 4px;
}

/* 重置按钮 */
.reset-btn {
  margin-top: 12px;
}

.footer {
  background: var(--color-bg-2);
  padding: 16px 20px;
  text-align: center;
  border-top: 1px solid var(--color-border-2);
  font-size: 12px;
  color: var(--color-text-3);
}

.footer p {
  margin: 0;
}

/* 响应式调整 */
@media (max-width: 450px) {
  .popup-container {
    width: 100%;
  }
}
</style>
