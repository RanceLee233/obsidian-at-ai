import { zhCn, I18nKey } from './zh-cn';
import { en } from './en';

export type Language = 'zh-cn' | 'en';

export interface I18nManager {
  currentLanguage: Language;
  t: (key: I18nKey) => string;
  setLanguage: (lang: Language) => void;
  detectLanguage: () => Language;
}

class I18nManagerImpl implements I18nManager {
  currentLanguage: Language = 'zh-cn';
  
  private translations = {
    'zh-cn': zhCn,
    'en': en
  };

  constructor() {
    // 初始化时检测语言
    this.currentLanguage = this.detectLanguage();
  }

  t = (key: I18nKey): string => {
    return this.translations[this.currentLanguage][key] || key;
  };

  setLanguage = (lang: Language): void => {
    this.currentLanguage = lang;
  };

  detectLanguage = (): Language => {
    try {
      // 尝试从Obsidian获取语言设置
      const obsidianLang = (window as any).app?.vault?.adapter?.path?.locale || 
                          navigator.language || 
                          'en';
      
      // 检查是否为中文
      if (obsidianLang.startsWith('zh')) {
        return 'zh-cn';
      }
      
      return 'en';
    } catch (error) {
      // 默认返回中文
      return 'zh-cn';
    }
  };
}

// 创建全局实例
export const i18n = new I18nManagerImpl();

// 导出快捷方法
export const t = i18n.t;
export const setLanguage = i18n.setLanguage;
export const getCurrentLanguage = () => i18n.currentLanguage;

export type { I18nKey } from './zh-cn';