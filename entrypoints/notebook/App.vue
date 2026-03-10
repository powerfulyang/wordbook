<template>
  <div class="notebook-wrapper">
    <!-- 头部区域 -->
    <div class="notebook-header">
      <div class="header-title">
        <span class="header-icon">📓</span>
        我的单词本
      </div>
    </div>

    <!-- 加载器 -->
    <a-spin :loading="!settings" class="notebook-spin" dot>
      <div v-if="settings" class="notebook-content">
        <a-tabs default-active-key="1">
          <!-- 收藏展台 -->
          <a-tab-pane key="1" title="⭐ 查看我的收藏">
            <template #title>
              ⭐ 我的收藏
              <a-tag color="gold" size="small" rounded style="margin-left: 8px">{{ settings.favoriteWords.length }}</a-tag>
            </template>
            
            <div class="filter-bar">
              <a-radio-group v-model="favoriteType" type="button">
                <a-radio value="word">单词 ({{ favoriteWords.length }})</a-radio>
                <a-radio value="sentence">句子 ({{ favoriteSentences.length }})</a-radio>
              </a-radio-group>
            </div>
            
            <a-empty v-if="currentFavorites.length === 0" description="暂无内容" />
            
            <a-list v-else :bordered="false" class="favorite-list">
              <a-list-item v-for="(favorite, index) in currentFavorites" :key="index"
                class="favorite-item">
                <a-list-item-meta>
                  <template #title>
                    <span class="favorite-word" :class="{ 'is-sentence': isSentence(favorite.word) }">{{ favorite.word }}</span>
                  </template>
                  <template #description>
                    <a-space direction="vertical" size="mini" class="favorite-details">
                      <!-- 单词/句子声音区 -->
                      <div v-if="!isSentence(favorite.word) && (favorite.phonetics || dictInfos[favorite.word]?.phonetics)" class="phonetics-row">
                        <div v-if="favorite.phonetics?.us || dictInfos[favorite.word]?.phonetics?.us" class="phonetic-item" @click="playWord(favorite.word, 0)" title="播放美式发音">
                          <span class="ph-label us-label">US</span>
                          <span class="ph-text">/{{ favorite.phonetics?.us || dictInfos[favorite.word]?.phonetics?.us }}/</span>
                          <icon-sound class="ph-icon" :size="14" />
                        </div>
                        <div v-if="favorite.phonetics?.uk || dictInfos[favorite.word]?.phonetics?.uk" class="phonetic-item" @click="playWord(favorite.word, 1)" title="播放英式发音">
                          <span class="ph-label uk-label">UK</span>
                          <span class="ph-text">/{{ favorite.phonetics?.uk || dictInfos[favorite.word]?.phonetics?.uk }}/</span>
                          <icon-sound class="ph-icon" :size="14" />
                        </div>
                      </div>

                      <div v-if="isSentence(favorite.word)" class="phonetics-row">
                        <div class="phonetic-item sentence-tts" @click="playTTS(favorite.word)" title="朗读句子">
                          <span class="ph-label us-label">朗读</span>
                          <span class="ph-text">Edge TTS</span>
                          <icon-sound class="ph-icon" :size="14" />
                        </div>
                      </div>

                      <div v-if="!isSentence(favorite.word) && dictInfos[favorite.word]?.translations?.length" class="translations-list">
                        <div v-for="(trans, i) in dictInfos[favorite.word]?.translations?.slice(0, 5)" :key="i" class="trans-item">
                          <span class="trans-dot"></span>
                          <span class="trans-text">{{ trans }}</span>
                        </div>
                      </div>
                      <span v-if="favorite.note" class="favorite-note">{{ favorite.note }}</span>
                      <span class="favorite-time">{{ formatDateTime(favorite.addedTime) }}</span>
                    </a-space>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-button type="text" status="danger" size="small" @click="handleRemoveFavorite(favorite.word)">
                    删除
                  </a-button>
                </template>
              </a-list-item>
            </a-list>
          </a-tab-pane>

          <!-- 历史展示 -->
          <a-tab-pane key="2" title="📚 查看最近查询">
            <template #title>
              📚 最近查询
              <a-tag color="blue" size="small" rounded style="margin-left: 8px">{{ settings.wordHistory.length }}</a-tag>
            </template>
            
            <div class="filter-bar">
              <a-radio-group v-model="historyType" type="button">
                <a-radio value="word">单词 ({{ historyWords.length }})</a-radio>
                <a-radio value="sentence">句子 ({{ historySentences.length }})</a-radio>
              </a-radio-group>
            </div>
            
            <a-empty v-if="currentHistory.length === 0" description="暂无历史" />
            
            <template v-else>
              <a-list v-if="historyType === 'word'" :bordered="false" class="favorite-list">
                <a-list-item v-for="(history, index) in currentHistory" :key="index" class="favorite-item">
                  <a-list-item-meta>
                    <template #title>
                      <span class="favorite-word" :class="{ 'is-sentence': isSentence(history.word) }">{{ history.word }}</span>
                    </template>
                    <template #description>
                      <a-space direction="vertical" size="mini" class="favorite-details">
                        <div v-if="dictInfos[history.word]?.phonetics" class="phonetics-row">
                          <div v-if="dictInfos[history.word]?.phonetics?.us" class="phonetic-item" @click="playWord(history.word, 0)" title="播放美式发音">
                            <span class="ph-label us-label">US</span>
                            <span class="ph-text">/{{ dictInfos[history.word]?.phonetics?.us }}/</span>
                            <icon-sound class="ph-icon" :size="14" />
                          </div>
                          <div v-if="dictInfos[history.word]?.phonetics?.uk" class="phonetic-item" @click="playWord(history.word, 1)" title="播放英式发音">
                            <span class="ph-label uk-label">UK</span>
                            <span class="ph-text">/{{ dictInfos[history.word]?.phonetics?.uk }}/</span>
                            <icon-sound class="ph-icon" :size="14" />
                          </div>
                        </div>
                        <div v-if="dictInfos[history.word]?.translations?.length" class="translations-list">
                          <div v-for="(trans, i) in dictInfos[history.word]?.translations?.slice(0, 5)" :key="i" class="trans-item">
                            <span class="trans-dot"></span>
                            <span class="trans-text">{{ trans }}</span>
                          </div>
                        </div>
                        <span class="favorite-time">{{ formatDateTime(history.time) }}</span>
                      </a-space>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </a-list>

              <a-list v-else :bordered="false" class="history-list">
                <a-list-item v-for="(history, index) in currentHistory" :key="index" class="favorite-item">
                  <a-list-item-meta>
                    <template #title>
                      <div class="favorite-word" :class="{ 'is-sentence': isSentence(history.word) }">{{ history.word }}</div>
                    </template>
                    <template #description>
                      <a-space direction="vertical" size="mini" class="favorite-details">
                        <div class="phonetics-row">
                          <div class="phonetic-item sentence-tts" @click="playTTS(history.word)" title="朗读句子">
                            <span class="ph-label us-label">朗读</span>
                            <span class="ph-text">Edge TTS</span>
                            <icon-sound class="ph-icon" :size="14" />
                          </div>
                        </div>
                        <span class="favorite-time">{{ formatDateTime(history.time) }}</span>
                      </a-space>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </a-list>
            </template>
          </a-tab-pane>
        </a-tabs>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { Message, Modal } from '@arco-design/web-vue';
import { IconSound } from '@arco-design/web-vue/es/icon';
import {
  getUserSettings,
  removeWordFromFavorites,
  type UserSettings
} from '../content/storage';
import { fetchWordInfo, type WordInfo, playUnifiedAudio, stopUnifiedAudio } from '../content/api';

const settings = ref<UserSettings | null>(null);

const favoriteType = ref('word');
const historyType = ref('word');

// 判断是否是句子
const isSentence = (text: string) => {
  if (!text) return false;
  return text.includes(' ') || text.length > 20;
};

const favoriteWords = computed(() => settings.value?.favoriteWords.filter(f => !isSentence(f.word)) || []);
const favoriteSentences = computed(() => settings.value?.favoriteWords.filter(f => isSentence(f.word)) || []);
const currentFavorites = computed(() => favoriteType.value === 'word' ? favoriteWords.value : favoriteSentences.value);

const historyWords = computed(() => settings.value?.wordHistory.filter(w => !isSentence(w.word)) || []);
const historySentences = computed(() => settings.value?.wordHistory.filter(w => isSentence(w.word)) || []);
const currentHistory = computed(() => historyType.value === 'word' ? historyWords.value : historySentences.value);

// 格式化时间
const formatDateTime = (timestamp: number) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const dictInfos = ref<Record<string, WordInfo>>({});

const loadWordInfos = async () => {
  if (!settings.value) return;
  const wordsToLoad = new Set<string>();
  
  settings.value.favoriteWords.forEach(f => {
    if (!isSentence(f.word)) wordsToLoad.add(f.word);
  });
  
  settings.value.wordHistory.forEach(h => {
    if (!isSentence(h.word)) wordsToLoad.add(h.word);
  });
  
  for (const word of wordsToLoad) {
    if (!dictInfos.value[word]) {
      fetchWordInfo(word).then(info => {
        if (info) dictInfos.value[word] = info;
      });
    }
  }
};

watch(() => settings.value, () => {
  loadWordInfos();
}, { deep: true });

// 播放单词发音
const playWord = (word: string, type: number) => {
  const audioType = type === 0 ? 'us' : 'uk';
  playUnifiedAudio(word, audioType, {
    volume: settings.value?.volume ?? 0.8,
    defaultVoice: settings.value?.defaultVoice === 'uk' ? 'uk' : 'us'
  });
};

// 播放TTS发音
const playTTS = (text: string) => {
  playUnifiedAudio(text, 'tts', {
    volume: settings.value?.volume ?? 0.8,
    defaultVoice: settings.value?.defaultVoice === 'uk' ? 'uk' : 'us'
  });
};

const handleRemoveFavorite = (word: string) => {
  Modal.confirm({
    title: '确认移除',
    content: `确定要移除收藏 "${word}" 吗？`,
    okText: '确定',
    cancelText: '取消',
    simple: false,
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

onMounted(async () => {
  settings.value = await getUserSettings();
});
</script>

<style scoped>
html, body {
  margin: 0;
  padding: 0;
  background-color: var(--color-fill-1);
}

.notebook-wrapper {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--color-bg-1);
  font-family: inherit;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
}

.notebook-header {
  background: var(--color-bg-1);
  padding: 20px 24px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-border-1);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-1);
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 24px;
}

.notebook-spin {
  flex: 1;
  display: flex !important;
  flex-direction: column;
}

.notebook-content {
  padding: 24px;
  flex: 1;
}

.history-space {
  margin-top: 16px;
}

.favorite-list {
  padding: 0;
}

.favorite-item {
  padding: 16px;
  margin-bottom: 12px;
  background-color: var(--color-fill-1);
  border-radius: 6px;
  transition: all 0.2s;
}

.favorite-item:hover {
  background-color: var(--color-fill-2);
}

.favorite-word {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
}

.favorite-word.is-sentence {
  font-weight: normal;
  font-size: 15px;
}

.favorite-details {
  margin-top: 8px;
}

.favorite-note {
  font-size: 13px;
  color: var(--color-text-3);
  font-style: italic;
  display: block;
  background: var(--color-bg-1);
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
}

.favorite-time {
  font-size: 12px;
  color: var(--color-text-4);
  margin-top: 4px;
}

.filter-bar {
  margin-bottom: 16px;
  display: flex;
}

.history-list {
  padding: 0;
  margin-top: 16px;
}

.translations-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.trans-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.trans-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-primary-light-4, #3b82f6);
  margin-top: 6px;
  flex-shrink: 0;
  opacity: 0.6;
}

.trans-text {
  font-size: 13px;
  line-height: 1.4;
  color: var(--color-text-2);
}

/* 音标区 */
.phonetics-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
  margin-bottom: 6px;
}

.phonetic-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--color-fill-2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  border: 1px solid transparent;
}

.phonetic-item:hover {
  background: var(--color-fill-3);
  border-color: var(--color-border-2);
}

.phonetic-item:active {
  transform: translateY(1px);
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

.us-label { background: rgb(var(--primary-6)); }
.uk-label { background: rgb(var(--purple-6)); }

.ph-text {
  font-size: 13px;
  color: var(--color-text-2);
  font-family: "Lucida Sans Unicode", "Arial Unicode MS", sans-serif;
  padding-bottom: 1px;
}

.ph-icon {
  color: var(--color-text-3);
}

.phonetic-item:hover .ph-icon {
  color: var(--color-text-2);
}

.sentence-tts {
  flex-direction: row;
  justify-content: center;
}
</style>
