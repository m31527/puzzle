import React, { createContext, useState, useContext } from 'react';
import zhTW from './zh-TW';
import zhCN from './zh-CN';

// 創建語言上下文
const LanguageContext = createContext();

// 語言選項
export const LANGUAGES = {
  ZH_TW: 'zh-TW',
  ZH_CN: 'zh-CN'
};

// 語言映射
const translationsMap = {
  [LANGUAGES.ZH_TW]: zhTW,
  [LANGUAGES.ZH_CN]: zhCN
};

// 設定預設語言 - 在這裡修改為 ZH_TW 或 ZH_CN
const DEFAULT_LANGUAGE = LANGUAGES.ZH_TW; // 預設使用繁體中文，可改為 LANGUAGES.ZH_CN

// 語言提供者組件
export const LanguageProvider = ({ children }) => {
  // 使用固定的預設語言
  const [language] = useState(DEFAULT_LANGUAGE);
  const [translations] = useState(translationsMap[DEFAULT_LANGUAGE]);

  // 翻譯函數
  const t = (key) => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// 自定義 Hook，方便在組件中使用語言上下文
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage 必須在 LanguageProvider 內使用');
  }
  return context;
};
