<template>
  <div class="app-wrapper">
    <!-- 头部区域 -->
    <div class="app-header">
      <div class="header-title">
        <img src="/logo.png" class="header-logo" alt="logo" />
        划词翻译
      </div>
      <div class="header-subtitle">设置中心</div>
    </div>

    <!-- 加载器 -->
    <a-spin :loading="!settings" class="app-spin" dot>
      <div v-if="settings" class="app-content">
        <a-space direction="vertical" size="medium" fill>

          <!-- AI 设置 -->
          <div class="settings-group">
            <h3 class="group-title">AI 翻译</h3>
            <div class="group-card">
              <div class="setting-item">
                <div class="item-icon bg-pink">🔑</div>
                <div class="item-content">
                  <div class="item-title">API Key</div>
                  <div class="item-desc">配置 AI 翻译的 API 密钥</div>
                  <div class="mt-2">
                    <a-input v-model="settings.difyApiEndpoint" placeholder="API URL" @change="handleSave" size="small" class="settings-input-item">
                      <template #prepend>Endpoint</template>
                    </a-input>
                  </div>
                  <div class="mt-2">
                    <a-input-password v-model="settings.difyApiKey" placeholder="输入 API Key" @change="handleSave" size="small" class="settings-input-item">
                      <template #prepend>API Key</template>
                    </a-input-password>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 基本设置 -->
          <div class="settings-group">
            <h3 class="group-title">通用</h3>
            <div class="group-card">
              <!-- 自动播放 -->
              <div class="setting-item">
                <div class="item-icon bg-blue">🔊</div>
                <div class="item-content">
                  <div class="item-title">自动播放发音</div>
                  <div class="item-desc">选中单词后自动播放发音</div>
                </div>
                <div class="item-action">
                  <a-switch v-model="settings.autoPlay" @change="handleSave" />
                </div>
              </div>

              <!-- 默认声调 -->
              <div class="setting-item">
                <div class="item-icon bg-purple">🌐</div>
                <div class="item-content">
                  <div class="item-title">默认发音</div>
                  <div class="item-desc">自动播放时使用的发音类型</div>
                </div>
                <div class="item-action">
                  <a-radio-group v-model="settings.defaultVoice" @change="handleSave" type="button" size="small">
                    <a-radio value="us">美</a-radio>
                    <a-radio value="uk">英</a-radio>
                  </a-radio-group>
                </div>
              </div>

              <!-- 显示音标 -->
              <div class="setting-item">
                <div class="item-icon bg-green">📖</div>
                <div class="item-content">
                  <div class="item-title">显示音标</div>
                  <div class="item-desc">在面板中显示国际音标</div>
                </div>
                <div class="item-action">
                  <a-switch v-model="settings.showPhonetics" @change="handleSave" />
                </div>
              </div>

              <!-- 音量 -->
              <div class="setting-item">
                <div class="item-icon bg-orange">🔉</div>
                <div class="item-content">
                  <div class="item-title">音量</div>
                  <div class="item-desc">{{ Math.round(settings.volume * 100) }}%</div>
                </div>
                <div class="item-action">
                  <div class="volume-slider">
                    <a-slider v-model="settings.volume" :min="0" :max="1" :step="0.1" @change="handleSave"
                      :show-tooltip="false" />
                  </div>
                </div>
              </div>
            </div>
          </div>



          <!-- 数据管理 -->
          <div class="settings-group">
            <h3 class="group-title">数据管理</h3>
            <div class="group-card">
              <div class="setting-item">
                <div class="item-icon bg-cyan">📚</div>
                <div class="item-content">
                  <div class="item-title">查询历史</div>
                  <div class="item-desc">已保存 {{ settings.wordHistory.length }} 个单词</div>
                </div>
                <div class="item-action">
                  <a-space>
                    <a-button type="primary" size="small" @click="openNotebook">查看</a-button>
                    <a-button type="outline" status="danger" size="small" @click="handleClearHistory"
                      :disabled="settings.wordHistory.length === 0">清空</a-button>
                  </a-space>
                </div>
              </div>

              <div class="setting-item">
                <div class="item-icon bg-gold">⭐</div>
                <div class="item-content">
                  <div class="item-title">收藏单词</div>
                  <div class="item-desc">已保存 {{ settings.favoriteWords.length }} 个单词</div>
                </div>
                <div class="item-action">
                  <a-space>
                    <a-button type="primary" size="small" @click="openNotebook">查看</a-button>
                    <a-button type="outline" status="danger" size="small" @click="handleClearFavorites"
                      :disabled="settings.favoriteWords.length === 0">清空</a-button>
                  </a-space>
                </div>
              </div>
            </div>
          </div>


          <!-- 重置按钮 -->
          <a-button type="primary" status="danger" long @click="handleReset" class="reset-btn">
            重置所有设置
          </a-button>
        </a-space>
      </div>
    </a-spin>

    <div class="app-footer">
      <a-typography-text type="secondary" class="footer-text">
        版本 1.0.0 <a-divider direction="vertical" /> 最后使用: {{ lastUsedText }}
      </a-typography-text>
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

const lastUsedText = computed(() => {
  if (!settings.value) return '未知';
  const date = new Date(settings.value.lastUsedTime);
  return date.toLocaleString('zh-CN');
});

const openNotebook = () => {
  const url = browser.runtime.getURL('/notebook.html' as any);
  window.open(url, '_blank');
};

const handleSave = async () => {
  if (!settings.value) return;
  await saveUserSettings(settings.value);
  Message.success('设置已保存');
};



const handleClearHistory = () => {
  Modal.confirm({
    title: '确认清空',
    content: '确定要清空所有查询历史吗？',
    okText: '确定',
    cancelText: '取消',
    simple: false,
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
    simple: false,
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

const handleClearFavorites = () => {
  Modal.confirm({
    title: '确认清空',
    content: '确定要清空所有收藏吗？',
    okText: '确定',
    cancelText: '取消',
    simple: false,
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
.app-wrapper {
  width: 100%;
  min-height: 550px;
  background: var(--color-fill-1);
  font-family: inherit;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: var(--color-bg-1);
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border-1);
  z-index: 10;
  position: sticky;
  top: 0;
}

.header-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-logo {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.header-subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-3);
  background: var(--color-fill-2);
  padding: 2px 8px;
  border-radius: 10px;
}

.app-spin {
  flex: 1;
  display: flex !important;
  flex-direction: column;
}

.app-content {
  padding: 20px 16px;
  flex: 1;
}

.settings-group {
  margin-bottom: 24px;
}

.group-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-3);
  margin: 0 0 10px 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.group-card {
  background-color: var(--color-bg-1);
  border-radius: 12px;
  border: 1px solid var(--color-border-1);
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-1);
}

.setting-item:last-child {
  border-bottom: none;
}

.item-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin-right: 14px;
  flex-shrink: 0;
}

.bg-blue {
  background-color: rgba(var(--arcoblue-6), 0.1);
  color: rgb(var(--arcoblue-6));
}

.bg-purple {
  background-color: rgba(var(--purple-6), 0.1);
  color: rgb(var(--purple-6));
}

.bg-green {
  background-color: rgba(var(--green-6), 0.1);
  color: rgb(var(--green-6));
}

.bg-orange {
  background-color: rgba(var(--orange-6), 0.1);
  color: rgb(var(--orange-6));
}

.bg-pink {
  background-color: rgba(var(--pink-6), 0.1);
  color: rgb(var(--pink-6));
}

.bg-cyan {
  background-color: rgba(var(--cyan-6), 0.1);
  color: rgb(var(--cyan-6));
}

.bg-gold {
  background-color: rgba(var(--gold-6), 0.1);
  color: rgb(var(--gold-6));
}

.item-content {
  flex: 1;
  min-width: 0;
  /* important for truncation */
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.item-title {
  font-size: 14px;
  color: var(--color-text-1);
  font-weight: 500;
  line-height: 1.3;
  margin-bottom: 4px;
}

.item-desc {
  font-size: 12px;
  color: var(--color-text-3);
  line-height: 1.4;
}

.item-action {
  flex-shrink: 0;
  margin-left: 14px;
}

.volume-slider {
  width: 130px;
  padding-right: 10px;
}

/* 主题按钮效果 */
.theme-btn.active-purple {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  color: #fff !important;
}

.theme-btn.active-blue {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important;
  border: none !important;
  color: #fff !important;
}

.theme-btn.active-green {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%) !important;
  border: none !important;
  color: #fff !important;
}


.reset-btn {
  margin-top: 10px;
  font-weight: 600;
}

.app-footer {
  padding: 16px 20px;
  text-align: center;
  background-color: var(--color-bg-1);
  border-top: 1px solid var(--color-border-2);
}

.footer-text {
  font-size: 12px;
}

/* 响应式调整 */
@media (max-width: 450px) {
  .app-wrapper {
    width: 100%;
  }
}

.mt-2 {
  margin-top: 8px;
}

.settings-input-item :deep(.arco-input-prepend) {
  width: 80px;
  display: flex;
  justify-content: center;
  color: var(--color-text-2);
  font-weight: 500;
}
</style>
