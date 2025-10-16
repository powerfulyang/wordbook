/**
 * 检查是否为英文单词
 */
export function isEnglishWord(text: string): boolean {
  return /^[a-zA-Z-']+$/.test(text);
}

/**
 * 清理文本（去除标点符号等）
 */
export function cleanText(text: string): string {
  return text.trim().replace(/[^\w\s-]/g, '');
}

/**
 * 检查文本是否为单个单词
 */
export function isSingleWord(text: string): boolean {
  const cleaned = cleanText(text);
  return cleaned.length > 0 && !cleaned.includes(' ');
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 计算面板位置，确保不超出屏幕
 */
export function calculatePanelPosition(
  mouseX: number,
  mouseY: number,
  panelWidth: number = 400,
  panelHeight: number = 400
): { x: number; y: number } {
  const padding = 10;
  const maxX = window.innerWidth - panelWidth - padding;
  const maxY = window.innerHeight - panelHeight - padding;
  
  let x = mouseX + padding;
  let y = mouseY + padding;
  
  // 确保不超出右边界
  if (x > maxX) {
    x = mouseX - panelWidth - padding;
  }
  
  // 确保不超出底部
  if (y > maxY) {
    y = mouseY - panelHeight - padding;
  }
  
  // 确保不超出左边界和顶部
  x = Math.max(padding, x);
  y = Math.max(padding, y);
  
  return { x, y };
}

/**
 * 格式化时间戳为相对时间
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return new Date(timestamp).toLocaleDateString('zh-CN');
  }
}

/**
 * 高亮文本中的关键词
 */
export function highlightKeyword(text: string, keyword: string): string {
  if (!keyword) return text;
  
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

