import React, { useReducer, useCallback, useMemo, useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  DeviceEventEmitter,
  ImageBackground,
  Alert,
  ActivityIndicator,
  Modal,
  NativeEventEmitter,
  NativeModules,
  Animated,
} from 'react-native';

import { LineChart } from 'react-native-chart-kit';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import Database from './utils/database';
import { useTest } from './contexts/TestContext';
import { GAME_CONFIG } from './config/gameConfig';
import PuzzleTest from './PuzzleTest';
import TestDataGenerator from './TestDataGenerator';

// 初始狀態
const initialState = {
  attentionData: [],  // 確保這裡初始化為空陣列
  meditationData: [],
  signalData: [],
  throwCount: 0,
  successCount: 0,
  throwHistory: [],
  isBigThrow: false,  // 新增用於追踪是否為大投擲
  enduranceData: {},  // 保留空對象以保持向後兼容性
  stabilityData: {},  // 改為空對象，因為我們使用新的計算方式
  attentionHistory: {},
  rawBrainwaveData: {
    attention: [],
    meditation: [],
    timestamps: []
  },
  thetaValues: [],  // 新增 theta 值的追蹤
  deltaValues: [],  // 新增 delta 值的追蹤
  lowAlphaValues: [],  // 新增 lowAlpha 值的追蹤
  highAlphaValues: [],  // 新增 highAlpha 值的追蹤
  lowBetaValues: [],  // 新增 lowBeta 值的追蹤
  highBetaValues: [],  // 新增 highBeta 值的追蹤
  lowGammaValues: [],  // 新增 lowGamma 值的追蹤
  midGammaValues: []  // 新增 midGamma 值的追蹤
};

// 定義 reducer action types
const ACTION_TYPES = {
  UPDATE_ATTENTION: 'UPDATE_ATTENTION',
  UPDATE_MEDITATION: 'UPDATE_MEDITATION',
  UPDATE_SIGNAL: 'UPDATE_SIGNAL',
  UPDATE_THROW_DATA: 'UPDATE_THROW_DATA',
  UPDATE_RAW_DATA: 'UPDATE_RAW_DATA',
  UPDATE_ENDURANCE_DATA: 'UPDATE_ENDURANCE_DATA',
  UPDATE_THETA: 'UPDATE_THETA',  // 新增 theta 更新的 action type
  UPDATE_DELTA: 'UPDATE_DELTA',  // 新增 delta 更新的 action type
  UPDATE_LOW_ALPHA: 'UPDATE_LOW_ALPHA',  // 新增 lowAlpha 更新的 action type
  UPDATE_HIGH_ALPHA: 'UPDATE_HIGH_ALPHA',  // 新增 highAlpha 更新的 action type
  UPDATE_LOW_BETA: 'UPDATE_LOW_BETA',  // 新增 lowBeta 更新的 action type
  UPDATE_HIGH_BETA: 'UPDATE_HIGH_BETA',  // 新增 highBeta 更新的 action type
  UPDATE_LOW_GAMMA: 'UPDATE_LOW_GAMMA',  // 新增 lowGamma 更新的 action type
  UPDATE_MID_GAMMA: 'UPDATE_MID_GAMMA',  // 新增 midGamma 更新的 action type
  RESET_GAME: 'RESET_GAME'
};

// Reducer 函數
function gameDataReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.UPDATE_ATTENTION: {
      const validValue = Number(action.payload);
      if (isNaN(validValue)) {
        //console.log('無效的專注度值:', action.payload);
        return state;
      }

      const newAttentionData = Array.isArray(state.attentionData) ? [...state.attentionData] : [];
      newAttentionData.push(validValue);

      if (newAttentionData.length > 30) {
        newAttentionData.shift();
      }

      return {
        ...state,
        attentionData: newAttentionData
      };
    }
    
    case ACTION_TYPES.UPDATE_MEDITATION: {
      const { value, timestamp } = action.payload;
      const MAX_DATA_POINTS = 30;
      
      const validValue = Number(value);
      if (isNaN(validValue)) return state;
      
      const newMeditationData = [...state.meditationData, validValue];
      if (newMeditationData.length > MAX_DATA_POINTS) {
        newMeditationData.shift();
      }
      
      return {
        ...state,
        meditationData: newMeditationData,
        rawBrainwaveData: {
          ...state.rawBrainwaveData,
          meditation: [...state.rawBrainwaveData.meditation, validValue],
          timestamps: [...(state.rawBrainwaveData.timestamps || []), timestamp]
        }
      };
    }
    
    case ACTION_TYPES.UPDATE_SIGNAL: {
      const { type, value } = action.payload;
      const validValue = Number(value);
      if (isNaN(validValue)) return state;
      
      switch (type) {
        case 'ATTENTION':
          return {
            ...state,
            attentionData: [...state.attentionData.slice(-30), validValue],
          };
        case 'MEDITATION':
          return {
            ...state,
            meditationData: [...state.meditationData.slice(-30), validValue],
          };
        case 'POOR_SIGNAL':
          return {
            ...state,
            signalData: [...state.signalData.slice(-30), validValue],
            signalQuality: validValue
          };
        default:
          return state;
      }
    }
    
    case ACTION_TYPES.UPDATE_THROW_DATA: {
      const { success, attention, timestamp, isBigThrow } = action.payload;
      const newThrowHistory = [...(state.throwHistory || [])];
      
      if (success) {
        newThrowHistory.push({
          success,
          attention,
          timestamp,
          isBigThrow
        });
      }
      
      return {
        ...state,
        throwCount: state.throwCount + 1,
        successCount: success ? state.successCount + 1 : state.successCount,
        throwHistory: newThrowHistory,
        isBigThrow
      };
    }
    
    case ACTION_TYPES.UPDATE_RAW_DATA: {
      const { dataType, value, timestamp } = action.payload;
      return {
        ...state,
        rawBrainwaveData: {
          ...state.rawBrainwaveData,
          [dataType]: [...state.rawBrainwaveData[dataType], value],
          timestamps: [...state.rawBrainwaveData.timestamps, timestamp]
        }
      };
    }
    
    case ACTION_TYPES.UPDATE_ENDURANCE_DATA:
      const newEnduranceData = {
        totalAttentionCount: state.enduranceData.totalAttentionCount + action.payload.totalAttentionCount,
        lowAttentionCount: state.enduranceData.lowAttentionCount + action.payload.lowAttentionCount
      };
      
      // console.log('更新維持度數據:', {
      //   current: newEnduranceData,
      //   total: newEnduranceData.totalAttentionCount,
      //   low: newEnduranceData.lowAttentionCount,
      //   rate: ((newEnduranceData.totalAttentionCount - newEnduranceData.lowAttentionCount) / newEnduranceData.totalAttentionCount * 100).toFixed(2) + '%'
      // });

      return {
        ...state,
        enduranceData: newEnduranceData
      };
      
    case ACTION_TYPES.UPDATE_THETA: {
      const validValue = Number(action.payload.value);
      if (isNaN(validValue)) {
        //console.log('無效的 Theta 值:', action.payload.value);
        return state;
      }

      const newThetaValues = [...(state.thetaValues || []), validValue];
      // console.log('Theta 值更新:', {
      //   新值: validValue,
      //   目前數據量: newThetaValues.length,
      //   所有值: newThetaValues
      // });

      return {
        ...state,
        thetaValues: newThetaValues
      };
    }
    
    case ACTION_TYPES.RESET_GAME:
      return {
        ...initialState,
        labels: Array.from({ length: 30 }, (_, i) => i.toString())
      };
      
    default:
      return state;
  }
}

// 投擲結果組件
const ThrowResults = React.memo(({ gameState }) => {
  const recentThrows = 5;
  const throwHistory = (gameState.throwHistory || []).slice().reverse();  // 反轉陣列以顯示最新的結果在左邊
  //const accuracy = gameState.throwCount > 0 ? Math.round((gameState.successCount / gameState.throwCount) * 100) : 0;

  // console.log('ThrowResults 渲染:', {
  //   throwCount: gameState.throwCount,
  //   successCount: gameState.successCount,
  //   throwHistory: throwHistory,
  //   accuracy
  // });

  const results = [];
  for (let i = 0; i < recentThrows; i++) {
    const hasThrow = i < throwHistory.length;
    const isSuccess = hasThrow && throwHistory[i].success;
    
    results.push(
      <View key={i} style={styles.accuracyItem}>
        <Text style={[
          styles.accuracyIcon,
          hasThrow ? (isSuccess ? styles.successIcon : styles.failureIcon) : styles.emptyIcon
        ]}>
          {hasThrow ? (isSuccess ? '✓' : '✗') : '-'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.accuracyContainer}>
      <Text style={styles.accuracyText}>
        準確率: {accuracy}% ({gameState.successCount}/{GAME_CONFIG.MAX_THROWS})
      </Text>
      <View style={styles.accuracyGrid}>
        {results}
      </View>
    </View>
  );
});

const Evaluate = forwardRef((props, ref) => {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();
  const [isTestMode, setIsTestMode] = useState(false);
  const [gameState, dispatch] = useReducer(gameDataReducer, initialState);
  const [testGenerator] = useState(() => new TestDataGenerator());
  const updateTimeoutRef = useRef(null);
  const [timeCounter, setTimeCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [thinkGearConnected, setThinkGearConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 3;

  // 圖表配置
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
    formatYLabel: (value) => Math.round(value).toString(),
    formatXLabel: (value) => '',
  };

  const renderChart = useCallback(() => {
    // 確保數據有效
    const validAttentionData = Array.isArray(gameState.attentionData) 
      ? gameState.attentionData.map(v => Number(v) || 0)
      : [0];
    const validMeditationData = gameState.meditationData.map(v => Number(v) || 0);
    const validSignalData = gameState.signalData.map(v => Number(v) || 0);

    // console.log('圖表數據:', {
    //   attention: validAttentionData,
    //   meditation: validMeditationData,
    //   signal: validSignalData,
    //   attentionLength: validAttentionData.length
    // });

    const chartData = {
      labels: Array.from({ length: Math.max(validAttentionData.length, 30) }, (_, i) => ''),
      datasets: [
        {
          data: validAttentionData,
          color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // 紅色
          strokeWidth: 2,
        },
        {
          data: validMeditationData.length ? validMeditationData : [0],
          color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`, // 綠色
          strokeWidth: 2,
        },
        {
          data: validSignalData.length ? validSignalData : [0],
          color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`, // 藍色
          strokeWidth: 2,
        },
      ],
      legend: ['專注度', '放鬆度', '信號強度']
    };

    return (
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 16}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          withDots={false}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={false}
          withHorizontalLabels={true}
          fromZero={true}
          yAxisInterval={20}
        />
      </View>
    );
  }, [gameState.attentionData, gameState.meditationData, gameState.signalData]);

  // 信號處理函數
  const handleSignalChange = useCallback((signal) => {
    if (!signal || !signal.signal || typeof signal.value !== 'number') {
      return;
    }

    const currentTime = Date.now();
    
    // 使用防抖來減少更新頻率
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      dispatch({
        type: ACTION_TYPES.UPDATE_SIGNAL,
        payload: {
          type: signal.signal,
          value: signal.value,
          timestamp: currentTime
        }
      });

      // console.log('收到信號更新:', {
      //   type: signal.signal,
      //   value: signal.value,
      //   timestamp: currentTime
      // });
    }, 100);  // 100ms 的防抖延遲
  }, []);

  // 處理 ESP32 數據
  const handleESP32Data = useCallback((event) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      
      if (data && (data.cast === true || data.castbig === true)) {
        const timestamp = Date.now();
        dispatch({
          type: ACTION_TYPES.UPDATE_THROW_DATA,
          payload: {
            success: true,
            attention: gameState.attentionData[gameState.attentionData.length - 1],
            timestamp,
            isBigThrow: data.castbig === true
          }
        });
      }
    } catch (error) {
      console.error('Evaluate - 處理 ESP32 數據錯誤:', error);
    }
  }, [gameState.attentionData, dispatch]);

  // 處理錯誤
  const handleError = useCallback((error) => {
    // 將錯誤轉換為警告
    console.warn('ThinkGear 警告:', typeof error === 'object' ? error.error || '連接中斷' : error);
    
    // 不要觸發斷開連接的處理
    if (!testGenerator) {
      setThinkGearConnected(false);
    }
  }, [testGenerator]);

  // 處理斷開連接
  const handleDisconnect = useCallback(() => {
    console.warn('設備連接中斷');
    if (!testGenerator) {
      setThinkGearConnected(false);
      
      // 如果重試次數未超過上限，嘗試重新連接
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        setReconnectAttempts(prev => prev + 1);
        console.warn(`嘗試重新連接 (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
        
        // 延遲 2 秒後重試
        setTimeout(() => {
          NativeModules.NeuroSkyModule.connect()
            .catch(err => {
              console.warn('重新連接失敗:', err);
            });
        }, 2000);
      }
    }
  }, [reconnectAttempts, testGenerator]);

  // 設置事件監聽器
  const subscriptionsRef = useRef([]);
  useEffect(() => {
    if (isFocused) {
      console.log('Evaluate 頁面獲得焦點，開始數據處理');
      setupEventListeners();
    } else {
      console.log('Evaluate 頁面失去焦點，停止數據處理');
      // 清理事件監聽器
      if (subscriptionsRef.current) {
        subscriptionsRef.current.forEach(subscription => subscription.remove());
        subscriptionsRef.current = [];
      }
    }
  }, [isFocused, setupEventListeners]);

  // 設置事件監聽器
  const setupEventListeners = useCallback(() => {
    try {
      if (Platform.OS === 'android') {
        const neuroSkyEmitter = new NativeEventEmitter(NativeModules.NeuroSkyModule);
        const esp32Emitter = new NativeEventEmitter(NativeModules.ESP32Module);

        // 添加事件監聽器並保存到 ref 中
        subscriptionsRef.current = [
          neuroSkyEmitter.addListener('onEegPower', (eegPower) => {
            // 更新所有腦電波頻段數據
            if (typeof eegPower.theta === 'number') {
              dispatch({
                type: ACTION_TYPES.UPDATE_THETA,
                payload: { value: eegPower.theta }
              });
            }
            
            // 更新其他頻段數據
            if (typeof eegPower.delta === 'number') {
              dispatch({
                type: ACTION_TYPES.UPDATE_DELTA,
                payload: { value: eegPower.delta }
              });
            }
            
            if (typeof eegPower.lowAlpha === 'number') {
              dispatch({
                type: ACTION_TYPES.UPDATE_LOW_ALPHA,
                payload: { value: eegPower.lowAlpha }
              });
            }
            
            if (typeof eegPower.highAlpha === 'number') {
              dispatch({
                type: ACTION_TYPES.UPDATE_HIGH_ALPHA,
                payload: { value: eegPower.highAlpha }
              });
            }
            
            if (typeof eegPower.lowBeta === 'number') {
              dispatch({
                type: ACTION_TYPES.UPDATE_LOW_BETA,
                payload: { value: eegPower.lowBeta }
              });
            }
            
            if (typeof eegPower.highBeta === 'number') {
              dispatch({
                type: ACTION_TYPES.UPDATE_HIGH_BETA,
                payload: { value: eegPower.highBeta }
              });
            }
            
            if (typeof eegPower.lowGamma === 'number') {
              dispatch({
                type: ACTION_TYPES.UPDATE_LOW_GAMMA,
                payload: { value: eegPower.lowGamma }
              });
            }
            
            if (typeof eegPower.midGamma === 'number') {
              dispatch({
                type: ACTION_TYPES.UPDATE_MID_GAMMA,
                payload: { value: eegPower.midGamma }
              });
            }
          }),
          neuroSkyEmitter.addListener('onSignalChange', (event) => {
            const timestamp = Date.now();
            if (event.signal === 'ATTENTION') {
              dispatch({
                type: ACTION_TYPES.UPDATE_ATTENTION,
                payload: event.value
              });
            } else if (event.signal === 'MEDITATION') {
              dispatch({
                type: ACTION_TYPES.UPDATE_MEDITATION,
                payload: { value: event.value, timestamp }
              });
            } else if (event.signal === 'POOR_SIGNAL') {
              dispatch({
                type: ACTION_TYPES.UPDATE_SIGNAL,
                payload: { type: 'POOR_SIGNAL', value: event.value }
              });
            }
          }),
          neuroSkyEmitter.addListener('onStateChange', (state) => {
            console.log('狀態變化:', state);
          }),
          esp32Emitter.addListener('onESP32Data', handleESP32Data)
        ];

        console.log('成功設置所有事件監聽器');
      }
    } catch (error) {
      console.error('設置事件監聽器時發生錯誤:', error);
    }
  }, [dispatch, handleESP32Data]);

  // 計算維持值
  const calculateEndurance = useCallback(() => {
    const attentionData = gameState.attentionData || [];
    const meditationData = gameState.meditationData || [];

    // 確保兩個數據都存在且長度一致
    if (attentionData.length === 0 || meditationData.length === 0) return 0;

    // 計算 ATTENTION 和 MEDITATION 的平均值
    const meanAttention = attentionData.reduce((sum, value) => sum + value, 0) / attentionData.length;
    const meanMeditation = meditationData.reduce((sum, value) => sum + value, 0) / meditationData.length;

    // 計算 ATTENTION 和 MEDITATION 的標準差
    const varianceAttention = attentionData.reduce((sum, value) => sum + Math.pow(value - meanAttention, 2), 0) / attentionData.length;
    const varianceMeditation = meditationData.reduce((sum, value) => sum + Math.pow(value - meanMeditation, 2), 0) / meditationData.length;

    const stdDevAttention = Math.sqrt(varianceAttention);
    const stdDevMeditation = Math.sqrt(varianceMeditation);

    // 綜合 ATTENTION 和 MEDITATION 的標準差
    const combinedStdDev = (stdDevAttention + stdDevMeditation) / 2;

    // 穩定度轉換：標準差越小，維持值越高
    const enduranceScore = 100 - Math.min(100, combinedStdDev);

    //console.log(`維持度計算: ATT均值=${meanAttention.toFixed(2)}, MED均值=${meanMeditation.toFixed(2)}, ATT標準差=${stdDevAttention.toFixed(2)}, MED標準差=${stdDevMeditation.toFixed(2)}, 穩定度=${enduranceScore.toFixed(2)}%`);
    
    return Math.round(enduranceScore);
  }, [gameState.attentionData, gameState.meditationData]);

  // 計算穩定度
  const calculateStability = useCallback(() => {
    const attentionData = gameState.attentionData || [];
    const meditationData = gameState.meditationData || [];

    // 如果沒有數據，返回預設的中等穩定度 50
    if (attentionData.length === 0 || meditationData.length === 0) return 50;

    // 計算低於40的次數
    const lowAttentionCount = attentionData.filter(value => value < 40).length;
    const lowMeditationCount = meditationData.filter(value => value < 40).length;

    // 計算總數據量
    const totalAttentionCount = attentionData.length;
    const totalMeditationCount = meditationData.length;
    const totalDataPoints = totalAttentionCount + totalMeditationCount;

    // 計算 ATTENTION 和 MEDITATION < 40 的比例
    const lowAttentionRatio = lowAttentionCount / totalAttentionCount;
    const lowMeditationRatio = lowMeditationCount / totalMeditationCount;

    // 設定 ATTENTION 與 MEDITATION 的權重
    const attentionWeight = 0.6;  // 專注佔 60%
    const meditationWeight = 0.4; // 冥想佔 40%

    // 計算加權低於 40 的比例
    const weightedLowRatio = (lowAttentionRatio * attentionWeight) + (lowMeditationRatio * meditationWeight);

    // 計算最終穩定度分數 (確保回傳值在 1-100 之間)
    let stabilityScore = (1 - weightedLowRatio) * 100;
    stabilityScore = Math.max(1, Math.min(100, stabilityScore));

    // console.log(`穩定度計算: 
    //   專注低於40次數=${lowAttentionCount}/${totalAttentionCount} (${(lowAttentionRatio * 100).toFixed(1)}%), 
    //   冥想低於40次數=${lowMeditationCount}/${totalMeditationCount} (${(lowMeditationRatio * 100).toFixed(1)}%), 
    //   加權比例=${(weightedLowRatio * 100).toFixed(1)}%, 
    //   最終分數=${Math.round(stabilityScore)}%`);

    return Math.round(stabilityScore);
  }, [gameState.attentionData, gameState.meditationData]);

  // 重置遊戲數據
  const resetData = useCallback(() => {
    dispatch({ type: ACTION_TYPES.RESET_GAME });
  }, [dispatch]);

  let gameData = {
  };
  // 處理結束遊戲
  const handleEndGame = useCallback(async () => {
    try {
      //console.log('準備結束遊戲，當前遊戲狀態:', gameState);
      
      const accuracy = calculateAccuracy();
      // const brainPower = calculateBrainPower();
      // const superPower = calculateSuperPower();
      // const endurance = calculateEndurance();
      // const stability = calculateStability();
      
      // 確保分數不會達到100，如果是100分則隨機給97-99分
      const capScore = (score) => {
        if (score >= 100) {
          return 97 + Math.floor(Math.random() * 3); // 隨機生成 97, 98, 或 99
        }
        return score;
      };
      
      const brainPower = capScore(calculateCoordinationAbility());//协调力（Coordination Ability）
      const superPower = capScore(calculateBrainActivity());//脑活力（Brain Activity）
      const stability = capScore(calculateFocusAbility());//专注力（Focus Ability）
      const endurance = capScore(calculatePerceptionAbility());//感知力（Perception Ability）


      const score = calculateScore();
      const percentilePosition = calculatePercentilePosition();
            
      // 儲存遊戲數據
      await Database.saveGameRecord(gameData);
      
      // 清理所有事件監聽器
      if (subscriptionsRef.current) {
        subscriptionsRef.current.forEach(subscription => subscription.remove());
        subscriptionsRef.current = [];
      }
      
      // 確保數據有效
      const validAttentionData = Array.isArray(gameState.attentionData) 
        ? gameState.attentionData.map(v => Number(v) || 0)
        : [0];
      const validMeditationData = Array.isArray(gameState.meditationData)
        ? gameState.meditationData.map(v => Number(v) || 0)
        : [0];

      gameData = {
        throwCount: gameState.throwCount,
        successCount: gameState.successCount,
        accuracy,
        brainPower,
        superPower,
        endurance,
        stability,
        score,
        percentilePosition,
        timestamp: new Date().toISOString(),
        attentionHistory: validAttentionData,
        meditationHistory: validMeditationData,
        completionTime: timeCounter
      };

      console.log('遊戲結束，完整數據:', gameData);

      // 導航到報告頁面，使用正確的數據格式
      navigation.navigate('Report', {
        gameData: gameData
      });
      
      // 重置遊戲狀態
      resetData();
      
    } catch (error) {
      console.error('結束遊戲時發生錯誤:', error);
      Alert.alert('錯誤', '儲存遊戲記錄時發生錯誤');
    }
  }, [
    gameState,
    calculateAccuracy,
    calculateBrainPower,
    calculateSuperPower,
    calculateEndurance,
    calculateStability,
    calculateCoordinationAbility,
    calculateBrainActivity,
    calculateFocusAbility,
    calculatePerceptionAbility,
    calculateScore,
    calculatePercentilePosition,
    navigation,
    resetData
  ]);

  // 處理投擲結果
  const handleThrow = useCallback(() => {
    const isSuccess = Math.random() < 0.5;  // 50% 成功率
    
    dispatch({
      type: ACTION_TYPES.UPDATE_THROW_DATA,
      payload: {
        throwTime: Date.now(),
        averageAttention: isSuccess ? 100 : 0
      }
    });

    console.log('投擲結果:', isSuccess ? '成功' : '失敗');  // 添加日誌
  }, []);

  // 計算準確率
  const calculateAccuracy = useCallback(() => {
    if (gameState.throwCount === 0) return 0;
    return Math.round((gameState.successCount / GAME_CONFIG.MAX_THROWS) * 100);
  }, [gameState.throwCount, gameState.successCount]);

  // 計算平均專注度
  const calculateAverageAttention = useCallback(() => {
    const values = gameState.attentionData;
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / values.length);
  }, [gameState.attentionData]);

  // 計算平均冥想度
  const calculateAverageMeditation = useCallback(() => {
    const values = gameState.meditationData;
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / values.length);
  }, [gameState.meditationData]);

  // 計算腦力值
  const calculateBrainPower = useCallback(() => {
    const avgAttention = calculateAverageAttention();
    const accuracy = calculateAccuracy();
    return Math.round((avgAttention + accuracy) / 2);
  }, [calculateAverageAttention, calculateAccuracy]);

  // 計算超能力值
  const computeSuperAbility = useCallback((theta) => {
    if (theta <= 4.3) return 0;  // 防止無效數據
    
    // 將 theta 值標準化到更合理的範圍
    const normalizedTheta = theta / 1000; // 將大數值縮小到更合理的範圍
    
    // 使用更合適的計算公式
    const score = Math.min(100, Math.max(0, 
      50 + (Math.log(normalizedTheta) / Math.log(200)) * 50
    ));
    
    // console.log('超能力計算過程:', {
    //   原始theta: theta,
    //   標準化theta: normalizedTheta,
    //   計算分數: score
    // });
    
    return score;
  }, []);

  // 標準化腦電波頻段數據
  const normalizeEegValues = useCallback((values) => {
    if (!values || values.length === 0) return [];
    
    // 找出最大值和最小值
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    // 避免除以零
    if (max === min) return values.map(() => 0.5);
    
    // 標準化到 0-1 範圍
    return values.map(value => (value - min) / (max - min));
  }, []);

  // 計算協調力 (Coordination Ability)
  const calculateCoordinationAbility = useCallback(() => {
    if (!gameState.thetaValues || gameState.thetaValues.length === 0) return 50;
    
    // 獲取各腦電波頻段數據
    const eegPower = {};
    
    // 使用 reducer 中的 thetaValues
    eegPower.theta = gameState.thetaValues || [];
    
    // 從 onEegPower 事件獲取的其他頻段數據
    // 如果沒有這些數據，使用空數組
    eegPower.delta = gameState.deltaValues || [];
    eegPower.lowAlpha = gameState.lowAlphaValues || [];
    eegPower.highAlpha = gameState.highAlphaValues || [];
    eegPower.lowBeta = gameState.lowBetaValues || [];
    eegPower.highBeta = gameState.highBetaValues || [];
    eegPower.lowGamma = gameState.lowGammaValues || [];
    eegPower.midGamma = gameState.midGammaValues || [];
    
    // 標準化各頻段數據
    const normalizedValues = [];
    for (const band in eegPower) {
      if (eegPower[band] && eegPower[band].length > 0) {
        // 計算平均值
        const avg = eegPower[band].reduce((sum, val) => sum + val, 0) / eegPower[band].length;
        normalizedValues.push(avg);
      }
    }
    
    // 如果沒有足夠的數據，返回默認值
    if (normalizedValues.length < 2) return 50;
    
    // 標準化數據
    const normalized = normalizeEegValues(normalizedValues);
    
    // 計算標準差
    const mean = normalized.reduce((sum, val) => sum + val, 0) / normalized.length;
    const variance = normalized.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / normalized.length;
    const stdDev = Math.sqrt(variance);
    
    // 計算協調力: 100 - (標準差 × 0.5)
    const coordinationScore = 100 - (stdDev * 50);
    
    // 確保分數在 0-100 範圍內
    return Math.max(0, Math.min(100, Math.round(coordinationScore)));
  }, [gameState.thetaValues, gameState.deltaValues, gameState.lowAlphaValues, gameState.highAlphaValues, 
      gameState.lowBetaValues, gameState.highBetaValues, gameState.lowGammaValues, gameState.midGammaValues, normalizeEegValues]);

  // 計算腦活力 (Brain Activity)
  const calculateBrainActivity = useCallback(() => {
    // 獲取需要的頻段數據
    const lowBetaValues = gameState.lowBetaValues || [];
    const highBetaValues = gameState.highBetaValues || [];
    const lowGammaValues = gameState.lowGammaValues || [];
    const midGammaValues = gameState.midGammaValues || [];
    
    // 如果沒有數據，返回默認值
    if (lowBetaValues.length === 0 && highBetaValues.length === 0 && 
        lowGammaValues.length === 0 && midGammaValues.length === 0) {
      return 50;
    }
    
    // 計算各頻段的平均值
    const avgLowBeta = lowBetaValues.length > 0 ? 
      lowBetaValues.reduce((sum, val) => sum + val, 0) / lowBetaValues.length : 0;
    const avgHighBeta = highBetaValues.length > 0 ? 
      highBetaValues.reduce((sum, val) => sum + val, 0) / highBetaValues.length : 0;
    const avgLowGamma = lowGammaValues.length > 0 ? 
      lowGammaValues.reduce((sum, val) => sum + val, 0) / lowGammaValues.length : 0;
    const avgMidGamma = midGammaValues.length > 0 ? 
      midGammaValues.reduce((sum, val) => sum + val, 0) / midGammaValues.length : 0;
    
    // 將所有非零平均值放入數組
    const values = [];
    if (avgLowBeta > 0) values.push(avgLowBeta);
    if (avgHighBeta > 0) values.push(avgHighBeta);
    if (avgLowGamma > 0) values.push(avgLowGamma);
    if (avgMidGamma > 0) values.push(avgMidGamma);
    
    // 如果沒有有效數據，返回默認值
    if (values.length === 0) return 50;
    
    // 標準化數據
    const normalized = normalizeEegValues(values);
    
    // 計算腦活力: (歸一化的 Low Beta + 歸一化的 High Beta + 歸一化的 Low Gamma + 歸一化的 Mid Gamma) / 4
    // 如果某些頻段沒有數據，我們只計算有數據的頻段
    const brainActivityScore = (normalized.reduce((sum, val) => sum + val, 0) / normalized.length) * 100;
    
    // 確保分數在 0-100 範圍內
    return Math.max(0, Math.min(100, Math.round(brainActivityScore)));
  }, [gameState.lowBetaValues, gameState.highBetaValues, gameState.lowGammaValues, gameState.midGammaValues, normalizeEegValues]);

  // 計算專注力 (Focus Ability)
  const calculateFocusAbility = useCallback(() => {
    // 獲取需要的頻段數據
    const alphaValues = [...(gameState.lowAlphaValues || []), ...(gameState.highAlphaValues || [])];
    const betaValues = [...(gameState.lowBetaValues || []), ...(gameState.highBetaValues || [])];
    
    // 如果沒有數據，使用 attentionData 作為替代
    if ((alphaValues.length === 0 || betaValues.length === 0) && gameState.attentionData && gameState.attentionData.length > 0) {
      return calculateAverageAttention();
    }
    
    // 如果仍然沒有數據，返回默認值
    if (alphaValues.length === 0 || betaValues.length === 0) {
      return 50;
    }
    
    // 計算 Alpha 和 Beta 的平均值
    const avgAlpha = alphaValues.reduce((sum, val) => sum + val, 0) / alphaValues.length;
    const avgBeta = betaValues.reduce((sum, val) => sum + val, 0) / betaValues.length;
    
    // 標準化數據
    const normalizedValues = normalizeEegValues([avgAlpha, avgBeta]);
    const normalizedAlpha = normalizedValues[0];
    const normalizedBeta = normalizedValues[1];
    
    // 計算專注力: [Beta / (Alpha + Beta)] × 100
    // 避免除以零
    if (normalizedAlpha + normalizedBeta === 0) return 50;
    
    const focusScore = (normalizedBeta / (normalizedAlpha + normalizedBeta)) * 100;
    
    // 確保分數在 0-100 範圍內
    return Math.max(0, Math.min(100, Math.round(focusScore)));
  }, [gameState.lowAlphaValues, gameState.highAlphaValues, gameState.lowBetaValues, gameState.highBetaValues, 
      gameState.attentionData, calculateAverageAttention, normalizeEegValues]);

  // 計算感知力 (Perception Ability)
  const calculatePerceptionAbility = useCallback(() => {
    // 獲取需要的頻段數據
    const thetaValues = gameState.thetaValues || [];
    const gammaValues = [...(gameState.lowGammaValues || []), ...(gameState.midGammaValues || [])];
    
    // 如果沒有數據，返回默認值
    if (thetaValues.length === 0 && gammaValues.length === 0) {
      return 50;
    }
    
    // 計算 Theta 和 Gamma 的平均值
    const avgTheta = thetaValues.length > 0 ? 
      thetaValues.reduce((sum, val) => sum + val, 0) / thetaValues.length : 0;
    const avgGamma = gammaValues.length > 0 ? 
      gammaValues.reduce((sum, val) => sum + val, 0) / gammaValues.length : 0;
    
    // 如果只有一種數據可用
    if (thetaValues.length === 0) return Math.min(100, Math.max(0, avgGamma / 10000 * 100));
    if (gammaValues.length === 0) return Math.min(100, Math.max(0, avgTheta / 10000 * 100));
    
    // 標準化數據
    const normalizedValues = normalizeEegValues([avgTheta, avgGamma]);
    const normalizedTheta = normalizedValues[0];
    const normalizedGamma = normalizedValues[1];
    
    // 計算感知力: Theta × 0.4 + Gamma × 0.6
    const perceptionScore = (normalizedTheta * 0.4 + normalizedGamma * 0.6) * 100;
    
    // 確保分數在 0-100 範圍內
    return Math.max(0, Math.min(100, Math.round(perceptionScore)));
  }, [gameState.thetaValues, gameState.lowGammaValues, gameState.midGammaValues, normalizeEegValues]);

  const calculateSuperPower = useCallback(() => {
    if (!gameState.thetaValues || gameState.thetaValues.length === 0) {
      console.log('沒有 Theta 數據，返回預設值');
      return 50; // 返回一個預設值而不是0
    }

    // 過濾掉異常值
    const validThetaValues = gameState.thetaValues.filter(value => {
      const isValid = value >= 4.3 && value <= 1000000; // 調整上限為更合理的值
      if (!isValid) {
        console.log('過濾掉異常 Theta 值:', value);
      }
      return isValid;
    });

    // console.log('Theta 數據處理:', {
    //   原始數據量: gameState.thetaValues.length,
    //   有效數據量: validThetaValues.length,
    //   原始數據: gameState.thetaValues,
    //   有效數據: validThetaValues
    // });

    if (validThetaValues.length === 0) {
      console.log('沒有有效的 Theta 數據，返回預設值');
      return 50;
    }

    const sumTheta = validThetaValues.reduce((acc, val) => acc + val, 0);
    const avgTheta = sumTheta / validThetaValues.length;

    // console.log('Theta 平均值計算:', {
    //   總和: sumTheta,
    //   平均值: avgTheta
    // });

    const superAbilityScore = computeSuperAbility(avgTheta);
    // console.log('超能力分數計算:', {
    //   平均Theta: avgTheta,
    //   分數: superAbilityScore
    // });

    return Math.round(superAbilityScore);
  }, [gameState.thetaValues, computeSuperAbility]);

  // 計算總分
  const calculateScore = useCallback(() => {
    // console.log('開始計算分數，當前 throwHistory:', gameState.throwHistory);
    
    let totalScore = 0;
    const scoreDetails = [];

    gameState.throwHistory.forEach((throw_, index) => {
      if (throw_.success) {
        const throwScore = throw_.isBigThrow ? GAME_CONFIG.SCORE_PER_BIG_HIT : GAME_CONFIG.SCORE_PER_HIT;
        totalScore += throwScore;
        
        console.log(`第 ${index + 1} 次投擲:`, {
          isBigThrow: throw_.isBigThrow,
          score: throwScore,
          runningTotal: totalScore
        });
        
        scoreDetails.push({
          index,
          type: throw_.isBigThrow ? 'castbig' : 'cast',
          score: throwScore,
          runningTotal: totalScore
        });
      }
    });

    console.log('分數計算結果:', {
      scoreDetails,
      totalScore,
      SCORE_PER_HIT: GAME_CONFIG.SCORE_PER_HIT,
      SCORE_PER_BIG_HIT: GAME_CONFIG.SCORE_PER_BIG_HIT
    });
    
    return totalScore;
  }, [gameState.throwHistory]);

  // 計算群眾百分比位置
  const calculatePercentilePosition = useCallback(() => {
    const hitCount = gameState.successCount;
    let cumulativePercentage = 0;
    
    // 計算到當前命中數的累積百分比
    for (let i = 0; i < hitCount; i++) {
      cumulativePercentage += GAME_CONFIG.HIT_DISTRIBUTION[i] || 0;
    }
    
    // 直接返回四捨五入後的整數
    return Math.round(cumulativePercentage);
  }, [gameState.successCount]);

  // 處理結束遊戲按鈕點擊
  const handleEndGameButtonPress = useCallback(() => {
    Alert.alert(
      '結束遊戲',
      '確定要結束本次遊戲嗎？',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '確定',
          onPress: () => {
            console.log('使用者確認結束遊戲');
            handleEndGame();
          }
        }
      ],
      { cancelable: false }
    );
  }, [handleEndGame]);

  useImperativeHandle(ref, () => ({
    resetData
  }));

  // 拼圖遊戲相關狀態
  const TOTAL_PIECES = 16;
  const [pieces, setPieces] = useState([]);
  const [completed, setCompleted] = useState(new Array(TOTAL_PIECES).fill(false));
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // 監控拼圖完成狀態
  useEffect(() => {
    if (completed.every(isComplete => isComplete)) {
      setShowCompletionModal(true);
    }
  }, [completed]);

  // 初始化拼圖
  useEffect(() => {
    const initialPieces = Array.from({ length: TOTAL_PIECES }, (_, index) => ({
      id: index + 1,
      position: new Animated.ValueXY(),
      isPlaced: false,
      pan: new Animated.ValueXY(),
    }));

    // 計算安全的可視範圍（考慮拼圖大小）
    const PIECE_SIZE = 50;
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const safeMargin = PIECE_SIZE;
    
    // 修改可視範圍，確保拼圖不會超出畫面
    const safeLeft = safeMargin;
    const safeRight = screenWidth - PIECE_SIZE - safeMargin;
    const safeTop = 10; // 增加上方空間
    const safeBottom = screenHeight * 0.6; // 限制在螢幕60%的高度內

    // 計算拼圖底圖的邊界
    const GRID_SIZE = 300;
    const GRID_OFFSET_X = (screenWidth - GRID_SIZE) / 2;
    const GRID_OFFSET_Y = 50;
    const puzzleLeft = GRID_OFFSET_X;
    const puzzleRight = GRID_OFFSET_X + GRID_SIZE;
    const puzzleTop = GRID_OFFSET_Y;
    const puzzleBottom = GRID_OFFSET_Y + GRID_SIZE;

    // 將拼圖均勻分布在四周
    initialPieces.forEach((piece, index) => {
      const piecesPerSide = Math.ceil(TOTAL_PIECES / 4);
      const sideIndex = Math.floor(index / piecesPerSide);
      
      let x, y;
      const spreadRange = PIECE_SIZE * 0.8; // 散布範圍
      
      switch(sideIndex) {
        case 0: // 上方
          x = puzzleLeft + (Math.random() * GRID_SIZE);
          y = Math.max(safeTop, puzzleTop - PIECE_SIZE - spreadRange);
          break;
        case 1: // 右方
          x = Math.min(safeRight, puzzleRight + spreadRange);
          y = puzzleTop + (Math.random() * GRID_SIZE);
          break;
        case 2: // 下方
          x = puzzleLeft + (Math.random() * GRID_SIZE);
          y = Math.min(safeBottom, puzzleBottom + spreadRange);
          break;
        case 3: // 左方
          x = Math.max(safeLeft, puzzleLeft - PIECE_SIZE - spreadRange);
          y = puzzleTop + (Math.random() * GRID_SIZE);
          break;
      }
      
      // 確保拼圖在安全範圍內
      x = Math.max(safeLeft, Math.min(safeRight, x));
      y = Math.max(safeTop, Math.min(safeBottom, y));
      
      // 加入小幅度的隨機偏移
      x += (Math.random() - 0.5) * PIECE_SIZE * 0.3;
      y += (Math.random() - 0.5) * PIECE_SIZE * 0.3;
      
      piece.position.setValue({ x, y });
    });

    setPieces(initialPieces);
  }, []);

  // 拼圖遊戲相關函數
  const handleAutoComplete = () => {
    const correctPositions = {
      1:  { x:  45,  y:  80 },  // 橘色十字
      2:  { x: 115,  y:  80 },  // 藍色圓形
      3:  { x: 185,  y:  80 },  // 紫色三角
      4:  { x: 245,  y:  80 },  // 綠色半圓
      5:  { x:  45,  y: 155 },  // 粉紅色星星
      6:  { x: 115,  y: 155 },  // 橘色橢圓
      7:  { x: 180,  y: 155 },  // 黃色五邊形
      8:  { x: 245,  y: 155 },  // 淺藍色方形
      9:  { x:  45,  y: 215 },  // 綠色梯形
      10: { x: 110,  y: 220 },  // 紅色六角
      11: { x: 175,  y: 215 },  // 藍色梅花
      12: { x: 245,  y: 215 },  // 綠色愛心
      13: { x:  45,  y: 285 },  // 黃色箭頭屋
      14: { x: 105,  y: 285 },  // 紫色X星
      15: { x: 175,  y: 285 },  // 粉色方塊
      16: { x: 245,  y: 285 },  // 紅色平行四邊形
    };
    
    const newPieces = [...pieces];
    newPieces.forEach(piece => {
      const correctPos = correctPositions[piece.id];
      piece.position.setValue({ x: correctPos.x, y: correctPos.y });
      piece.pan.setValue({ x: 0, y: 0 });
    });
    setPieces(newPieces);
    setCompleted(new Array(TOTAL_PIECES).fill(true));
  };

  const handlePiecePress = (index) => {
    // 如果需要處理拼圖點擊事件
    console.log('Piece pressed:', index);
  };

  // 初始化計時器
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeCounter(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // 初始化 TestDataGenerator
  useEffect(() => {
    if (isTestMode && testGenerator) {
      testGenerator.startGenerating();
    }
    return () => {
      if (testGenerator) {
        testGenerator.stopGenerating();
      }
    };
  }, [isTestMode, testGenerator]);

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      if (subscriptionsRef.current) {
        subscriptionsRef.current.forEach(subscription => subscription.remove());
        subscriptionsRef.current = [];
      }
    };
  }, []);

  // 渲染
  return (
    <ImageBackground
      source={require('../assets/img/background.png')}
      style={styles.background}
    >
      <View style={styles.container}>
        {renderChart()}
        {/* End game button */}
        <View style={styles.pizzleGameZone}>
          <PuzzleTest
            gameData={gameData}
            completed={completed}
            handleAutoComplete={handleAutoComplete}
            handlePiecePress={handlePiecePress}
            pieces={pieces}
            navigation={navigation}
          />
        </View>
        {/* Bottom navigation */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.footerButton}
            onPress={() => navigation.navigate('Home')}>
            <ImageBackground
              source={require('../assets/img/btn.png')}
              style={styles.buttonBackground}
              resizeMode="stretch"
            >
              <Text style={styles.footerButtonText}>回首頁</Text>
            </ImageBackground>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.footerButton}
            onPress={() => navigation.navigate('History')}>
            <ImageBackground
              source={require('../assets/img/btn.png')}
              style={styles.buttonBackground}
              resizeMode="stretch"
            >
              <Text style={styles.footerButtonText}>歷史紀錄</Text>
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </View>

      {/* Completion Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={showCompletionModal}>
        <View style={styles.modalBackground}>
          <View style={[styles.loadingContainer, styles.completionContainer]}>
            <Text style={styles.completionText}>恭喜完成拼圖！</Text>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => {
                handleEndGame();
                setShowCompletionModal(false);
              }}>
              <Text style={styles.reportButtonText}>查看報告</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={isLoading}>
        <View style={styles.modalBackground}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
});

const styles = StyleSheet.create({
  completionContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
  },
  completionText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  reportButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 5,
  },
  reportButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#d4373d',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    marginHorizontal: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  endButton: {
    backgroundColor: '#b04a5a',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10,
  },
  playerInfo: {
    alignItems: 'center',
    marginVertical: 10,
  },
  playerInfoText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  brainwaveContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 20,
    padding: 15,
    borderRadius: 10,
  },
  accuracyContainer: {
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  accuracyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  accuracyGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accuracyItem: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  accuracyIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  successIcon: {
    color: '#4CAF50',  // 綠色
  },
  failureIcon: {
    color: '#f44336',  // 紅色
  },
  emptyIcon: {
    color: '#9e9e9e',  // 灰色
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 0,
    paddingHorizontal: 20,
    width: '100%',
  },
  footerButton: {
    width: '45%',
  },
  buttonBackground: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerButtonText: {
    color: '#1D417D',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  testButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  testButton: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
  },
  hitButton: {
    backgroundColor: '#4CAF50',
  },
  missButton: {
    backgroundColor: '#f44336',
  },
  testButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default Evaluate;
