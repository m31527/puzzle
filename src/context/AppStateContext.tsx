import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';

interface AppStateContextType {
  isProcessingPaused: boolean;
  pauseProcessing: () => void;
  resumeProcessing: () => void;
}

interface AppStateProviderProps {
  children: ReactNode;
}

const AppStateContext = createContext<AppStateContextType | null>(null);

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [isProcessingPaused, setIsProcessingPaused] = useState<boolean>(false);
  const [subscriptions, setSubscriptions] = useState<EmitterSubscription[]>([]);

  // 暫停所有背景處理
  const pauseProcessing = () => {
    try {
      // 清理現有的訂閱
      subscriptions.forEach(subscription => subscription.remove());
      
      // 創建空的監聽器來防止數據處理
      const newSubscriptions: EmitterSubscription[] = [];
      
      if (NativeModules.NeuroSkyModule) {
        const neuroSkyEmitter = new NativeEventEmitter(NativeModules.NeuroSkyModule);
        newSubscriptions.push(
          neuroSkyEmitter.addListener('onEegPower', () => {}),
          neuroSkyEmitter.addListener('onSignalChange', () => {}),
          neuroSkyEmitter.addListener('onStateChange', () => {})
        );
      }
      
      if (NativeModules.ESP32Module) {
        const esp32Emitter = new NativeEventEmitter(NativeModules.ESP32Module);
        newSubscriptions.push(
          esp32Emitter.addListener('onESP32Data', () => {})
        );
      }
      
      setSubscriptions(newSubscriptions);
      setIsProcessingPaused(true);
      console.log('已暫停所有背景處理');
    } catch (error) {
      console.error('暫停背景處理時發生錯誤:', error);
    }
  };

  // 恢復所有背景處理
  const resumeProcessing = () => {
    try {
      // 移除空的監聽器
      subscriptions.forEach(subscription => subscription.remove());
      setSubscriptions([]);
      setIsProcessingPaused(false);
      console.log('已恢復所有背景處理');
    } catch (error) {
      console.error('恢復背景處理時發生錯誤:', error);
    }
  };

  // 清理函數
  useEffect(() => {
    return () => {
      subscriptions.forEach(subscription => subscription.remove());
    };
  }, []);

  return (
    <AppStateContext.Provider value={{
      isProcessingPaused,
      pauseProcessing,
      resumeProcessing
    }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
