# 划词翻译 Chrome 扩展

一个支持划词发音的 Chrome 浏览器扩展，使用 WXT + Vue 3 开发，采用 Shadow DOM 隔离样式。

## 功能特性

### 核心功能
- ✨ **划词选中**: 在任何网页上选中单词即可显示发音面板
- 🔊 **双语发音**: 支持美式英语和英式英语发音
- 📖 **音标展示**: 自动获取并显示美式和英式音标
- ⭐ **单词收藏**: 一键收藏单词，保存音标信息
- 📚 **查询历史**: 自动记录查询过的单词（最多50个）

### 个性化设置
- 🎨 **主题切换**: 紫色、蓝色、绿色三种主题随心选
- 🔉 **音量调节**: 自定义发音音量大小
- 🎵 **自动播放**: 可设置选中单词后自动播放发音
- 🌐 **默认发音**: 自定义默认使用美音或英音
- 👁️ **音标显示**: 可选择是否显示音标

### 技术特性
- 💾 **数据持久化**: 所有设置和收藏自动保存，重启浏览器不丢失
- 🎯 **智能定位**: 浮动面板自动显示在选中文字附近
- 🛡️ **样式隔离**: 使用 Shadow DOM 确保不影响原网页样式
- 🚀 **免费 API**: 使用多个免费 API 获取发音和音标

## 使用方法

### 基本使用
1. **安装扩展**: 加载扩展到 Chrome 浏览器
2. **划词查询**: 在任何网页上选中英文单词
3. **查看信息**: 自动显示浮动面板，包含：
   - 单词本身
   - 收藏按钮（星标）
   - 美式和英式音标
   - 发音按钮（美音/英音）

### 收藏单词
- 点击浮动面板上的 **☆** 图标收藏单词
- 已收藏的单词显示为金色 **★**
- 再次点击可取消收藏

### 管理设置
1. 点击浏览器工具栏的扩展图标
2. 打开设置面板，可以：
   - 调整主题颜色
   - 设置自动播放
   - 选择默认发音
   - 调节音量大小
   - 查看收藏列表
   - 管理查询历史

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式（Chrome）
pnpm dev

# 开发模式（Firefox）
pnpm dev:firefox

# 构建
pnpm build

# 打包
pnpm zip
```

## API 说明

### 音标和释义 API
使用 Dictionary API 获取音标和释义：
- 接口：`https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- 完全免费、无需 API Key
- 返回详细的单词信息，包括：
  - 国际音标（IPA）
  - 词性和释义
  - 例句
- 自动区分美式和英式音标

### 发音 API
使用有道词典在线发音接口：
- 美音：`https://dict.youdao.com/dictvoice?type=0&audio={word}`
- 英音：`https://dict.youdao.com/dictvoice?type=1&audio={word}`
- 真人发音，音质清晰

## 技术栈

- [WXT](https://wxt.dev/) - 浏览器扩展开发框架
- [Vue 3](https://vuejs.org/) - 渐进式 JavaScript 框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM) - 样式隔离
- [UnoCSS](https://unocss.dev/) - 原子化 CSS 引擎
- [Arco Design Vue](https://arco.design/vue) - UI 组件库

## 项目结构

```
entrypoints/
├── content/
│   ├── index.ts        # Content Script 入口
│   ├── App.vue         # 浮动面板 Vue 组件
│   ├── storage.ts      # 数据持久化模块
│   └── style.css       # 全局样式
└── popup/
    ├── index.html      # 设置页面 HTML
    ├── main.ts         # 设置页面入口
    └── App.vue         # 设置页面 Vue 组件
```

## 数据存储

扩展使用 `chrome.storage.local` API 持久化以下数据：

### 用户设置
- `autoPlay`: 是否自动播放发音
- `defaultVoice`: 默认发音类型（美音/英音）
- `showPhonetics`: 是否显示音标
- `theme`: 主题颜色（purple/blue/green）
- `volume`: 音量大小（0-1）
- `lastUsedTime`: 最后使用时间

### 用户数据
- `wordHistory`: 查询历史（最多50个）
- `favoriteWords`: 收藏的单词列表，每个包含：
  - `word`: 单词文本
  - `phonetics`: 音标信息（美式/英式）
  - `addedTime`: 添加时间
  - `note`: 备注（可选）

## 设计亮点

- 🌈 **渐变背景**: 使用紫色渐变背景，视觉效果出众
- ✨ **磨砂玻璃**: backdrop-filter 实现磨砂玻璃效果
- 🎭 **流畅动画**: 淡入动画和悬停效果
- 🎯 **响应式按钮**: 悬停和点击状态反馈
- 📱 **边界检测**: 自动调整位置避免超出屏幕
- 🔤 **音标展示**: 自动区分美式和英式音标，优雅展示

## 界面预览

### 浮动面板
```
┌─────────────────────────┐
│  example      ★         │  ← 单词 + 收藏按钮
├─────────────────────────┤
│ 🇺🇸 /ɪɡˈzæm.pəl/        │  ← 美式音标
│ 🇬🇧 /ɪɡˈzɑːm.pl̩/       │  ← 英式音标
├─────────────────────────┤
│  [🇺🇸 美音] [🇬🇧 英音]  │  ← 发音按钮
└─────────────────────────┘
```

### 设置面板
- 🔊 自动播放设置
- 🌐 默认发音选择
- 📖 音标显示开关
- 🎨 主题颜色切换（紫/蓝/绿）
- 🔉 音量滑块调节
- ⭐ 收藏单词列表（带播放和删除按钮）
- 📚 查询历史记录
- 🔄 重置所有设置

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar).
