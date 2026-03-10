// 使用Chrome Extension Storage API

export interface HistoryItem {
  word: string;
  time: number;
}

export interface UserSettings {
  autoPlay: boolean;
  defaultVoice: 'us' | 'uk';
  showPhonetics: boolean;
  volume: number;
  wordHistory: HistoryItem[];
  favoriteWords: FavoriteWord[];
  lastUsedTime: number;
  difyApiKey: string;
  difyApiEndpoint: string;
}

export interface FavoriteWord {
  word: string;
  phonetics?: {
    us?: string;
    uk?: string;
  };
  note?: string;
  addedTime: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  autoPlay: true,
  defaultVoice: 'us',
  showPhonetics: true,
  volume: 0.8,
  wordHistory: [],
  favoriteWords: [],
  lastUsedTime: Date.now(),
  difyApiKey: '',
  difyApiEndpoint: '',
};

export async function getUserSettings(): Promise<UserSettings> {
  const result = await browser.storage.local.get('userSettings');
  const stored = result.userSettings || {};
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    wordHistory: Array.isArray(stored.wordHistory) 
      ? stored.wordHistory.map((item: any) => {
          if (typeof item === 'string') {
            return { word: item, time: Date.now() };
          }
          return item;
        })
      : [],
    favoriteWords: Array.isArray(stored.favoriteWords) ? stored.favoriteWords : [],
  };
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  await browser.storage.local.set({ userSettings: settings });
}

export async function addWordToHistory(word: string): Promise<void> {
  const settings = await getUserSettings();
  const history = settings.wordHistory.filter((w: any) => {
    const wordStr = typeof w === 'string' ? w : w.word;
    return wordStr.toLowerCase() !== word.toLowerCase();
  });
  
  history.unshift({ word, time: Date.now() });
  
  // 保留最近100个
  if (history.length > 100) {
    history.pop();
  }
  
  settings.wordHistory = history;
  settings.lastUsedTime = Date.now();
  await saveUserSettings(settings);
}

export async function clearWordHistory(): Promise<void> {
  const settings = await getUserSettings();
  settings.wordHistory = [];
  await saveUserSettings(settings);
}

export async function addWordToFavorites(
  word: string,
  phonetics?: { us?: string; uk?: string },
  note?: string
): Promise<void> {
  const settings = await getUserSettings();
  
  // 检查是否已收藏
  const exists = settings.favoriteWords.some(
    f => f.word.toLowerCase() === word.toLowerCase()
  );
  
  if (!exists) {
    settings.favoriteWords.unshift({
      word,
      phonetics,
      note,
      addedTime: Date.now(),
    });
    await saveUserSettings(settings);
  }
}

export async function removeWordFromFavorites(word: string): Promise<void> {
  const settings = await getUserSettings();
  settings.favoriteWords = settings.favoriteWords.filter(
    f => f.word.toLowerCase() !== word.toLowerCase()
  );
  await saveUserSettings(settings);
}

export async function clearFavorites(): Promise<void> {
  const settings = await getUserSettings();
  settings.favoriteWords = [];
  await saveUserSettings(settings);
}

export async function resetSettings(): Promise<void> {
  await saveUserSettings(DEFAULT_SETTINGS);
}

export async function isWordFavorited(word: string): Promise<boolean> {
  const settings = await getUserSettings();
  return settings.favoriteWords.some(
    f => f.word.toLowerCase() === word.toLowerCase()
  );
}

