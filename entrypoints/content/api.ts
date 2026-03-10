import { getUserSettings } from './storage';

// 本地字典数据类型
interface DictWord {
  name: string;
  trans?: string[];
  usphone?: string;
  ukphone?: string;
}

export interface WordInfo {
  word: string;
  phonetics?: {
    us?: string;
    uk?: string;
  };
  usAudio?: string;
  ukAudio?: string;
  translations?: string[];
  translationSource?: 'dict' | 'ai';
  definitions?: Array<{
    pos: string; // 词性
    meanings: string[];
  }>;
  examples?: string[];
}

// 字典加载器类型
type DictionaryLoader = () => Promise<DictWord[]>;

// 字典缓存
const dictionariesCache = new Map<string, DictWord[]>();

// 字典加载器列表（按优先级排序，使用静态 import）
const DICTIONARY_LOADERS: Array<{ name: string; loader: DictionaryLoader }> = [
  {
    name: '2025KaoYanHongBaoShu',
    loader: async () => (await import('../dicts/2025KaoYanHongBaoShu.json')).default as DictWord[]
  },
  {
    name: 'coca20000',
    loader: async () => (await import('../dicts/coca20000.json')).default as DictWord[]
  },
  {
    name: 'GaoKao_3500',
    loader: async () => (await import('../dicts/GaoKao_3500.json')).default as DictWord[]
  },
  {
    name: 'English_II',
    loader: async () => (await import('../dicts/English_II.json')).default as DictWord[]
  },
  {
    name: 'GaoZhongluan_2_T',
    loader: async () => (await import('../dicts/GaoZhongluan_2_T.json')).default as DictWord[]
  },
];

/**
 * 加载单个字典
 */
async function loadDictionary(name: string, loader: DictionaryLoader): Promise<DictWord[] | null> {
  // 检查缓存
  if (dictionariesCache.has(name)) {
    return dictionariesCache.get(name)!;
  }

  try {
    const dict = await loader();
    dictionariesCache.set(name, dict);
    return dict;
  } catch (error) {
    console.error(`加载字典 ${name} 失败:`, error);
    return null;
  }
}

/**
 * 从本地字典中查找单词（逐个加载，找到即停止）
 */
async function searchWordInDicts(word: string): Promise<DictWord | null> {
  const searchWord = word.toLowerCase().trim();

  // 逐个加载字典并搜索
  for (const { name, loader } of DICTIONARY_LOADERS) {
    const dict = await loadDictionary(name, loader);

    if (!dict) continue;

    const found = dict.find((item: DictWord) =>
      item.name.toLowerCase() === searchWord
    );

    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * 从本地字典获取音标和释义，发音从有道词典获取
 */
export async function fetchWordInfo(word: string): Promise<WordInfo | null> {
  try {
    const trimmedWord = word.trim().toLowerCase();
    if (!trimmedWord) return null;

    // 从本地字典中查找单词
    const dictWord = await searchWordInDicts(trimmedWord);

    if (!dictWord) {
      return null;
    }

    // 解析音标
    const phonetics: { us?: string; uk?: string } = {};
    if (dictWord.usphone) {
      phonetics.us = dictWord.usphone;
    }
    if (dictWord.ukphone) {
      phonetics.uk = dictWord.ukphone;
    }

    // 解析释义
    const translations: string[] = dictWord.trans || [];

    return {
      word: trimmedWord,
      phonetics,
      usAudio: getTTSUrl(trimmedWord, 'us'),
      ukAudio: getTTSUrl(trimmedWord, 'uk'),
      translations: translations.length > 0 ? translations : ['暂无释义'],
      definitions: [],
      examples: [],
    };
  } catch (error) {
    console.error('获取单词信息失败:', error);
    return null;
  }
}

/**
 * 简单版本：只获取音标和音频URL
 */
export function getSimpleWordInfo(word: string): WordInfo {
  const trimmedWord = word.trim();
  return {
    word: trimmedWord,
    usAudio: getTTSUrl(trimmedWord, 'us'),
    ukAudio: getTTSUrl(trimmedWord, 'uk'),
  };
}

/**
 * 播放单词发音
 */
export function getTTSUrl(text: string, type: 'us' | 'uk' | 'tts', defaultVoice: 'us' | 'uk' = 'us'): string {
  const endpoint = 'https://us4ever.com/api/tts';
  let voice = '';
  if (type === 'us') {
    voice = 'en-US-AriaNeural';
  } else if (type === 'uk') {
    voice = 'en-GB-SoniaNeural';
  } else {
    voice = defaultVoice === 'uk' ? 'en-GB-SoniaNeural' : 'en-US-AriaNeural';
  }
  return `${endpoint}?text=${encodeURIComponent(text)}&voice=${voice}`;
}

export let currentPlayingAudio: HTMLAudioElement | null = null;

export async function playUnifiedAudio(
  text: string,
  type: 'us' | 'uk' | 'tts',
  options: {
    volume?: number;
    defaultVoice?: 'us' | 'uk';
    onStart?: () => void;
    onEnded?: () => void;
  } = {}
): Promise<HTMLAudioElement> {
  const { volume = 0.8, defaultVoice = 'us', onStart, onEnded } = options;

  stopUnifiedAudio();

  const url = getTTSUrl(text, type, defaultVoice);
  const audio = new Audio(url);
  audio.volume = volume;
  currentPlayingAudio = audio;

  if (onStart) {
    onStart();
  }

  const handleEnded = () => {
    if (onEnded) onEnded();
  };

  audio.addEventListener('ended', handleEnded, { once: true });
  audio.addEventListener('error', handleEnded, { once: true });

  try {
    await audio.play();
  } catch (err) {
    console.error('播放失败:', err);
    if (onEnded) onEnded();
  }

  return audio;
}

export function stopUnifiedAudio() {
  if (currentPlayingAudio) {
    currentPlayingAudio.pause();
    currentPlayingAudio.currentTime = 0;
    currentPlayingAudio = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}



/**
 * 使用 Dify API 翻译句子
 */
export async function translateSentence(text: string): Promise<string | null> {
  try {
    const settings = await getUserSettings();
    const endpoint = settings.difyApiEndpoint;
    const apiKey = settings.difyApiKey;

    if (!endpoint || !apiKey) {
      console.warn('未配置 Dify API Endpoint 或 Key');
      return '请先在插件设置中配置 AI 翻译 Endpoint 和 API Key';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: { query: text, },
        query: text,
        response_mode: 'blocking',
        user: 'test-user'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Dify API 错误:', errorData);
      return `翻译请求失败: ${response.statusText}`;
    }

    const data = await response.json();
    return data.answer || null;
  } catch (e) {
    console.error('Dify API 报错:', e);
    return null;
  }
}


