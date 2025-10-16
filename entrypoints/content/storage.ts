// 使用Chrome Extension Storage API

export interface UserSettings {
  autoPlay: boolean;
  defaultVoice: 'us' | 'uk';
  showPhonetics: boolean;
  theme: 'purple' | 'blue' | 'green';
  volume: number;
  wordHistory: string[];
  favoriteWords: FavoriteWord[];
  lastUsedTime: number;
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
  theme: 'purple',
  volume: 0.8,
  wordHistory: [],
  favoriteWords: [],
  lastUsedTime: Date.now(),
};

export async function getUserSettings(): Promise<UserSettings> {
  const result = await browser.storage.local.get('userSettings');
  return result.userSettings || DEFAULT_SETTINGS;
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  await browser.storage.local.set({ userSettings: settings });
}

export async function addWordToHistory(word: string): Promise<void> {
  const settings = await getUserSettings();
  const history = settings.wordHistory.filter(w => w.toLowerCase() !== word.toLowerCase());
  history.unshift(word);
  
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

