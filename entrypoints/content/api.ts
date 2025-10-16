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
      usAudio: `https://dict.youdao.com/dictvoice?type=0&audio=${encodeURIComponent(trimmedWord)}`,
      ukAudio: `https://dict.youdao.com/dictvoice?type=1&audio=${encodeURIComponent(trimmedWord)}`,
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
    usAudio: `https://dict.youdao.com/dictvoice?type=0&audio=${encodeURIComponent(trimmedWord)}`,
    ukAudio: `https://dict.youdao.com/dictvoice?type=1&audio=${encodeURIComponent(trimmedWord)}`,
  };
}

/**
 * 播放单词发音
 */
export function playWordAudio(
  word: string,
  type: 'us' | 'uk',
  volume: number = 0.8
): HTMLAudioElement {
  const audioType = type === 'us' ? 0 : 1;
  const url = `https://dict.youdao.com/dictvoice?type=${audioType}&audio=${encodeURIComponent(word)}`;
  
  const audio = new Audio(url);
  audio.volume = volume;
  audio.play().catch(err => {
    console.error('播放失败:', err);
  });
  
  return audio;
}

