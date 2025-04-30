import React, { useReducer, useCallback, useMemo, useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Alert,
  ActivityIndicator,
  Modal,
  NativeEventEmitter,
  NativeModules,
  Animated,
} from 'react-native';

import { useNavigation, useIsFocused } from '@react-navigation/native';
import Database from './utils/database';
import { GAME_CONFIG } from './config/gameConfig';
import PuzzleTest from './PuzzleTest';

// 初始状态
const initialState = {
  attentionData: [],  // 确保这里初始化为空数组
  meditationData: [],
  signalData: [],
  throwCount: 0,
  successCount: 0,
  throwHistory: [],
  isBigThrow: false,  // 新增用于追踪是否为大投掷
  enduranceData: {},  // 保留空对象以保持向后兼容性
  stabilityData: {},  // 改为空对象，因为我们使用新的计算方式
  attentionHistory: {},
  rawBrainwaveData: {
    attention: [],
    meditation: [],
    timestamps: []
  },
  thetaValues: [],  // 新增 theta 值的追踪
  deltaValues: [],  // 新增 delta 值的追踪
  lowAlphaValues: [],  // 新增 lowAlpha 值的追踪
  highAlphaValues: [],  // 新增 highAlpha 值的追踪
  lowBetaValues: [],  // 新增 lowBeta 值的追踪
  highBetaValues: [],  // 新增 highBeta 值的追踪
  lowGammaValues: [],  // 新增 lowGamma 值的追踪
  midGammaValues: []  // 新增 midGamma 值的追踪
};

// 定义 reducer action types
const ACTION_TYPES = {
  UPDATE_ATTENTION: 'UPDATE_ATTENTION',
  UPDATE_MEDITATION: 'UPDATE_MEDITATION',
  UPDATE_SIGNAL: 'UPDATE_SIGNAL',
  UPDATE_THROW_DATA: 'UPDATE_THROW_DATA',
  UPDATE_RAW_DATA: 'UPDATE_RAW_DATA',
  UPDATE_ENDURANCE_DATA: 'UPDATE_ENDURANCE_DATA',
  UPDATE_EEG_POWER: 'UPDATE_EEG_POWER', // 新增 EEG 功率数据更新的 action type
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

// Reducer 函数
function gameDataReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.UPDATE_ATTENTION: {
      const validValue = Number(action.payload);
      if (isNaN(validValue)) {
        //console.log('无效的专注度值:', action.payload);
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

      return {
        ...state,
        enduranceData: newEnduranceData
      };
      
    case ACTION_TYPES.UPDATE_EEG_POWER: {
      const updates = action.payload;
      const newState = { ...state };
      
      if (updates.theta) {
        newState.thetaValues = [...(newState.thetaValues || []), updates.theta];
      }
      if (updates.delta) {
        newState.deltaValues = [...(newState.deltaValues || []), updates.delta];
      }
      if (updates.lowAlpha) {
        newState.lowAlphaValues = [...(newState.lowAlphaValues || []), updates.lowAlpha];
      }
      if (updates.highAlpha) {
        newState.highAlphaValues = [...(newState.highAlphaValues || []), updates.highAlpha];
      }
      if (updates.lowBeta) {
        newState.lowBetaValues = [...(newState.lowBetaValues || []), updates.lowBeta];
      }
      if (updates.highBeta) {
        newState.highBetaValues = [...(newState.highBetaValues || []), updates.highBeta];
      }
      if (updates.lowGamma) {
        newState.lowGammaValues = [...(newState.lowGammaValues || []), updates.lowGamma];
      }
      if (updates.midGamma) {
        newState.midGammaValues = [...(newState.midGammaValues || []), updates.midGamma];
      }
      
      return newState;
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

// 投掷结果组件

const Evaluate = forwardRef((props, ref) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [gameState, dispatch] = useReducer(gameDataReducer, initialState);
  const [timeCounter, setTimeCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // 处理 ESP32 数据
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
      console.error('Evaluate - 处理 ESP32 数据错误:', error);
    }
  }, [gameState.attentionData, dispatch]);

  // 处理 EEG 功率数据
  const handleEEGPowerData = useCallback((eegPower) => {
    const updates = {};
    if (typeof eegPower.theta === 'number') {
      updates.theta = eegPower.theta;
    }
    if (typeof eegPower.delta === 'number') {
      updates.delta = eegPower.delta;
    }
    if (typeof eegPower.lowAlpha === 'number') {
      updates.lowAlpha = eegPower.lowAlpha;
    }
    if (typeof eegPower.highAlpha === 'number') {
      updates.highAlpha = eegPower.highAlpha;
    }
    if (typeof eegPower.lowBeta === 'number') {
      updates.lowBeta = eegPower.lowBeta;
    }
    if (typeof eegPower.highBeta === 'number') {
      updates.highBeta = eegPower.highBeta;
    }
    if (typeof eegPower.lowGamma === 'number') {
      updates.lowGamma = eegPower.lowGamma;
    }
    if (typeof eegPower.midGamma === 'number') {
      updates.midGamma = eegPower.midGamma;
    }
    
    // Dispatch all updates in one action
    dispatch({
      type: ACTION_TYPES.UPDATE_EEG_POWER,
      payload: updates
    });
  }, [dispatch]);

  // 设置事件监听器
  const subscriptionsRef = useRef([]);
  useEffect(() => {
    if (isFocused) {
      console.log('Evaluate 页面获得焦点，开始数据处理');
      setupEventListeners();
    } else {
      console.log('Evaluate 页面失去焦点，停止数据处理');
      // 清理事件监听器
      if (subscriptionsRef.current) {
        subscriptionsRef.current.forEach(subscription => subscription.remove());
        subscriptionsRef.current = [];
      }
    }
  }, [isFocused, setupEventListeners]);

  // 设置事件监听器
  const setupEventListeners = useCallback(() => {
    try {
      if (Platform.OS === 'android') {
        const neuroSkyEmitter = new NativeEventEmitter(NativeModules.NeuroSkyModule);
        const esp32Emitter = new NativeEventEmitter(NativeModules.ESP32Module);

        // Add event listeners and save to ref
        subscriptionsRef.current = [
          neuroSkyEmitter.addListener('onEegPower', handleEEGPowerData),
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
            console.log('状态变化:', state);
          }),
          esp32Emitter.addListener('onESP32Data', handleESP32Data)
        ];

        console.log('成功设置所有事件监听器');
      }
    } catch (error) {
      console.error('设置事件监听器时发生错误:', error);
    }
  }, [handleEEGPowerData, handleESP32Data]);

  // 计算维持值
  const calculateEndurance = useCallback(() => {
    const attentionData = gameState.attentionData || [];
    const meditationData = gameState.meditationData || [];

    // 确保两个数据都存在且长度一致
    if (attentionData.length === 0 || meditationData.length === 0) return 0;

    // 计算 ATTENTION 和 MEDITATION 的平均值
    const meanAttention = attentionData.reduce((sum, value) => sum + value, 0) / attentionData.length;
    const meanMeditation = meditationData.reduce((sum, value) => sum + value, 0) / meditationData.length;

    // 计算 ATTENTION 和 MEDITATION 的标准差
    const varianceAttention = attentionData.reduce((sum, value) => sum + Math.pow(value - meanAttention, 2), 0) / attentionData.length;
    const varianceMeditation = meditationData.reduce((sum, value) => sum + Math.pow(value - meanMeditation, 2), 0) / meditationData.length;

    const stdDevAttention = Math.sqrt(varianceAttention);
    const stdDevMeditation = Math.sqrt(varianceMeditation);

    // 综合 ATTENTION 和 MEDITATION 的标准差
    const combinedStdDev = (stdDevAttention + stdDevMeditation) / 2;

    // 稳定度转换：标准差越小，维持值越高
    const enduranceScore = 100 - Math.min(100, combinedStdDev);

    //console.log(`维持度计算: ATT均值=${meanAttention.toFixed(2)}, MED均值=${meanMeditation.toFixed(2)}, ATT标准差=${stdDevAttention.toFixed(2)}, MED标准差=${stdDevMeditation.toFixed(2)}, 稳定度=${enduranceScore.toFixed(2)}%`);
    
    return Math.round(enduranceScore);
  }, [gameState.attentionData, gameState.meditationData]);

  // 计算稳定度
  const calculateStability = useCallback(() => {
    const attentionData = gameState.attentionData || [];
    const meditationData = gameState.meditationData || [];

    // 如果没有数据，返回预设的中等稳定度 50
    if (attentionData.length === 0 || meditationData.length === 0) return 50;

    // 计算低于40的次数
    const lowAttentionCount = attentionData.filter(value => value < 40).length;
    const lowMeditationCount = meditationData.filter(value => value < 40).length;

    // 计算总数据量
    const totalAttentionCount = attentionData.length;
    const totalMeditationCount = meditationData.length;
    const totalDataPoints = totalAttentionCount + totalMeditationCount;

    // 计算 ATTENTION 和 MEDITATION < 40 的比例
    const lowAttentionRatio = lowAttentionCount / totalAttentionCount;
    const lowMeditationRatio = lowMeditationCount / totalMeditationCount;

    // 设定 ATTENTION 与 MEDITATION 的权重
    const attentionWeight = 0.6;  // 专注占 60%
    const meditationWeight = 0.4; // 冥想占 40%

    // 计算加权低于 40 的比例
    const weightedLowRatio = (lowAttentionRatio * attentionWeight) + (lowMeditationRatio * meditationWeight);
    let stabilityScore = (1 - weightedLowRatio) * 100;
    stabilityScore = Math.max(1, Math.min(100, stabilityScore));

    return Math.round(stabilityScore);
  }, [gameState.attentionData, gameState.meditationData]);

  // 重置游戏数据
  const resetData = useCallback(() => {
    dispatch({ type: ACTION_TYPES.RESET_GAME });
  }, [dispatch]);

  let gameData = {
  };
  // 处理结束游戏
  const handleEndGame = useCallback(async () => {
    try {
      
      const accuracy = calculateAccuracy();
      
      // 确保分数不会达到100，如果是100分则随机给97-99分
      const capScore = (score) => {
        if (score >= 100) {
          return 97 + Math.floor(Math.random() * 3); // 随机生成 97, 98, 或 99
        }
        return score;
      };
      
      const brainPower = capScore(calculateCoordinationAbility());//协调力（Coordination Ability）
      const superPower = capScore(calculateBrainActivity());//脑活力（Brain Activity）
      const stability = capScore(calculateFocusAbility());//专注力（Focus Ability）
      const endurance = capScore(calculatePerceptionAbility());//感知力（Perception Ability）
      const score = calculateScore();
      const percentilePosition = calculatePercentilePosition();
      
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
      // 存储游戏数据
      await Database.saveGameRecord(gameData);
      
      // 清理所有事件监听器
      if (subscriptionsRef.current) {
        subscriptionsRef.current.forEach(subscription => subscription.remove());
        subscriptionsRef.current = [];
      }
      
      // 确保数据有效
      const validAttentionData = Array.isArray(gameState.attentionData) 
        ? gameState.attentionData.map(v => Number(v) || 0)
        : [0];
      const validMeditationData = Array.isArray(gameState.meditationData)
        ? gameState.meditationData.map(v => Number(v) || 0)
        : [0];

      console.log('游戏结束，完整数据:', gameData);

      // 导航到报告页面，使用正确的数据格式
      navigation.navigate('Report', {
        gameData: gameData
      });
      
      // 重置游戏状态
      resetData();
      
    } catch (error) {
      console.error('结束游戏时发生错误:', error);
      Alert.alert('错误', '存储游戏记录时发生错误');
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

  // 计算准确率
  const calculateAccuracy = useCallback(() => {
    if (gameState.throwCount === 0) return 0;
    return Math.round((gameState.successCount / GAME_CONFIG.MAX_THROWS) * 100);
  }, [gameState.throwCount, gameState.successCount]);

  // 计算平均专注度
  const calculateAverageAttention = useCallback(() => {
    const values = gameState.attentionData;
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / values.length);
  }, [gameState.attentionData]);

  // 计算脑力值
  const calculateBrainPower = useCallback(() => {
    const avgAttention = calculateAverageAttention();
    const accuracy = calculateAccuracy();
    return Math.round((avgAttention + accuracy) / 2);
  }, [calculateAverageAttention, calculateAccuracy]);

  // 计算超能力值
  const computeSuperAbility = useCallback((theta) => {
    if (theta <= 4.3) return 0;  // 防止无效数据
    
    // 将 theta 值标准化到更合理的范围
    const normalizedTheta = theta / 1000; // 将大数值缩小到更合理的范围
    
    // 使用更合适的计算公式
    const score = Math.min(100, Math.max(0, 
      50 + (Math.log(normalizedTheta) / Math.log(200)) * 50
    ));
    
    return score;
  }, []);

  // 标准化脑电波频段数据
  const normalizeEegValues = useCallback((values) => {
    if (!values || values.length === 0) return [];
    
    // 找出最大值和最小值
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    // 避免除以零
    if (max === min) return values.map(() => 0.5);
    
    // 标准化到 0-1 范围
    return values.map(value => (value - min) / (max - min));
  }, []);

  // 计算协调力 (Coordination Ability)
  const calculateCoordinationAbility = useCallback(() => {
    if (!gameState.thetaValues || gameState.thetaValues.length === 0) return 50;
    
    // 获取各脑电波频段数据
    const eegPower = {};
    
    // 使用 reducer 中的 thetaValues
    eegPower.theta = gameState.thetaValues || [];
    
    // 从 onEegPower 事件获取的其他频段数据
    // 如果没有这些数据，使用空数组
    eegPower.delta = gameState.deltaValues || [];
    eegPower.lowAlpha = gameState.lowAlphaValues || [];
    eegPower.highAlpha = gameState.highAlphaValues || [];
    eegPower.lowBeta = gameState.lowBetaValues || [];
    eegPower.highBeta = gameState.highBetaValues || [];
    eegPower.lowGamma = gameState.lowGammaValues || [];
    eegPower.midGamma = gameState.midGammaValues || [];
    
    // 标准化各频段数据
    const normalizedValues = [];
    for (const band in eegPower) {
      if (eegPower[band] && eegPower[band].length > 0) {
        // 计算平均值
        const avg = eegPower[band].reduce((sum, val) => sum + val, 0) / eegPower[band].length;
        normalizedValues.push(avg);
      }
    }
    
    // 如果没有足够的数据，返回默认值
    if (normalizedValues.length < 2) return 50;
    
    // 标准化数据
    const normalized = normalizeEegValues(normalizedValues);
    
    // 计算标准差
    const mean = normalized.reduce((sum, val) => sum + val, 0) / normalized.length;
    const variance = normalized.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / normalized.length;
    const stdDev = Math.sqrt(variance);
    
    // 计算协调力: 100 - (标准差 × 0.5)
    const coordinationScore = 100 - (stdDev * 50);
    
    // 确保分数在 0-100 范围内
    return Math.max(0, Math.min(100, Math.round(coordinationScore)));
  }, [gameState.thetaValues, gameState.deltaValues, gameState.lowAlphaValues, gameState.highAlphaValues, 
      gameState.lowBetaValues, gameState.highBetaValues, gameState.lowGammaValues, gameState.midGammaValues, normalizeEegValues]);

  // 计算脑活力 (Brain Activity)
  const calculateBrainActivity = useCallback(() => {
    // 获取需要的频段数据
    const lowBetaValues = gameState.lowBetaValues || [];
    const highBetaValues = gameState.highBetaValues || [];
    const lowGammaValues = gameState.lowGammaValues || [];
    const midGammaValues = gameState.midGammaValues || [];
    
    // 如果没有数据，返回默认值
    if (lowBetaValues.length === 0 && highBetaValues.length === 0 && 
        lowGammaValues.length === 0 && midGammaValues.length === 0) {
      return 50;
    }
    
    // 计算各频段的平均值
    const avgLowBeta = lowBetaValues.length > 0 ? 
      lowBetaValues.reduce((sum, val) => sum + val, 0) / lowBetaValues.length : 0;
    const avgHighBeta = highBetaValues.length > 0 ? 
      highBetaValues.reduce((sum, val) => sum + val, 0) / highBetaValues.length : 0;
    const avgLowGamma = lowGammaValues.length > 0 ? 
      lowGammaValues.reduce((sum, val) => sum + val, 0) / lowGammaValues.length : 0;
    const avgMidGamma = midGammaValues.length > 0 ? 
      midGammaValues.reduce((sum, val) => sum + val, 0) / midGammaValues.length : 0;
    
    // 将所有非零平均值放入数组
    const values = [];
    if (avgLowBeta > 0) values.push(avgLowBeta);
    if (avgHighBeta > 0) values.push(avgHighBeta);
    if (avgLowGamma > 0) values.push(avgLowGamma);
    if (avgMidGamma > 0) values.push(avgMidGamma);
    
    // 如果没有有效数据，返回默认值
    if (values.length === 0) return 50;
    
    // 标准化数据
    const normalized = normalizeEegValues(values);
    
    // 计算脑活力: (归一化的 Low Beta + 归一化的 High Beta + 归一化的 Low Gamma + 归一化的 Mid Gamma) / 4
    // 如果某些频段没有数据，我们只计算有数据的频段
    const brainActivityScore = (normalized.reduce((sum, val) => sum + val, 0) / normalized.length) * 100;
    
    // 确保分数在 0-100 范围内
    return Math.max(0, Math.min(100, Math.round(brainActivityScore)));
  }, [gameState.lowBetaValues, gameState.highBetaValues, gameState.lowGammaValues, gameState.midGammaValues, normalizeEegValues]);

  // 计算专注力 (Focus Ability)
  const calculateFocusAbility = useCallback(() => {
    // 获取需要的频段数据
    const alphaValues = [...(gameState.lowAlphaValues || []), ...(gameState.highAlphaValues || [])];
    const betaValues = [...(gameState.lowBetaValues || []), ...(gameState.highBetaValues || [])];
    
    // 如果没有数据，使用 attentionData 作为替代
    if ((alphaValues.length === 0 || betaValues.length === 0) && gameState.attentionData && gameState.attentionData.length > 0) {
      return calculateAverageAttention();
    }
    
    // 如果仍然没有数据，返回默认值
    if (alphaValues.length === 0 || betaValues.length === 0) {
      return 50;
    }
    
    // 计算 Alpha 和 Beta 的平均值
    const avgAlpha = alphaValues.reduce((sum, val) => sum + val, 0) / alphaValues.length;
    const avgBeta = betaValues.reduce((sum, val) => sum + val, 0) / betaValues.length;
    
    // 标准化数据
    const normalizedValues = normalizeEegValues([avgAlpha, avgBeta]);
    const normalizedAlpha = normalizedValues[0];
    const normalizedBeta = normalizedValues[1];
    
    // 计算专注力: [Beta / (Alpha + Beta)] × 100
    // 避免除以零
    if (normalizedAlpha + normalizedBeta === 0) return 50;
    
    const focusScore = (normalizedBeta / (normalizedAlpha + normalizedBeta)) * 100;
    
    // 确保分数在 0-100 范围内
    return Math.max(0, Math.min(100, Math.round(focusScore)));
  }, [gameState.lowAlphaValues, gameState.highAlphaValues, gameState.lowBetaValues, gameState.highBetaValues, 
      gameState.attentionData, calculateAverageAttention, normalizeEegValues]);

  // 计算感知力 (Perception Ability)
  const calculatePerceptionAbility = useCallback(() => {
    // 获取需要的频段数据
    const thetaValues = gameState.thetaValues || [];
    const gammaValues = [...(gameState.lowGammaValues || []), ...(gameState.midGammaValues || [])];
    
    // 如果没有数据，返回默认值
    if (thetaValues.length === 0 && gammaValues.length === 0) {
      return 50;
    }
    
    // 计算 Theta 和 Gamma 的平均值
    const avgTheta = thetaValues.length > 0 ? 
      thetaValues.reduce((sum, val) => sum + val, 0) / thetaValues.length : 0;
    const avgGamma = gammaValues.length > 0 ? 
      gammaValues.reduce((sum, val) => sum + val, 0) / gammaValues.length : 0;
    
    // 如果只有一种数据可用
    if (thetaValues.length === 0) return Math.min(100, Math.max(0, avgGamma / 10000 * 100));
    if (gammaValues.length === 0) return Math.min(100, Math.max(0, avgTheta / 10000 * 100));
    
    // 标准化数据
    const normalizedValues = normalizeEegValues([avgTheta, avgGamma]);
    const normalizedTheta = normalizedValues[0];
    const normalizedGamma = normalizedValues[1];
    
    // 计算感知力: Theta × 0.4 + Gamma × 0.6
    const perceptionScore = (normalizedTheta * 0.4 + normalizedGamma * 0.6) * 100;
    
    // 确保分数在 0-100 范围内
    return Math.max(0, Math.min(100, Math.round(perceptionScore)));
  }, [gameState.thetaValues, gameState.lowGammaValues, gameState.midGammaValues, normalizeEegValues]);

  const calculateSuperPower = useCallback(() => {
    if (!gameState.thetaValues || gameState.thetaValues.length === 0) {
      console.log('没有 Theta 数据，返回预设值');
      return 50; // 返回一个预设值而不是0
    }

    // 过滤掉异常值
    const validThetaValues = gameState.thetaValues.filter(value => {
      const isValid = value >= 4.3 && value <= 1000000; // 调整上限为更合理的值
      if (!isValid) {
        console.log('过滤掉异常 Theta 值:', value);
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
      console.log('没有有效的 Theta 数据，返回预设值');
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

  // 计算总分
  const calculateScore = useCallback(() => {
    // console.log('开始计算分数，当前 throwHistory:', gameState.throwHistory);
    
    let totalScore = 0;
    const scoreDetails = [];

    gameState.throwHistory.forEach((throw_, index) => {
      if (throw_.success) {
        const throwScore = throw_.isBigThrow ? GAME_CONFIG.SCORE_PER_BIG_HIT : GAME_CONFIG.SCORE_PER_HIT;
        totalScore += throwScore;
        
        console.log(`第 ${index + 1} 次投掷:`, {
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

    console.log('分数计算结果:', {
      scoreDetails,
      totalScore,
      SCORE_PER_HIT: GAME_CONFIG.SCORE_PER_HIT,
      SCORE_PER_BIG_HIT: GAME_CONFIG.SCORE_PER_BIG_HIT
    });
    
    return totalScore;
  }, [gameState.throwHistory]);

  // 计算群众百分比位置
  const calculatePercentilePosition = useCallback(() => {
    const hitCount = gameState.successCount;
    let cumulativePercentage = 0;
    
    // 计算到当前命中数的累积百分比
    for (let i = 0; i < hitCount; i++) {
      cumulativePercentage += GAME_CONFIG.HIT_DISTRIBUTION[i] || 0;
    }
    
    // 直接返回四舍五入后的整数
    return Math.round(cumulativePercentage);
  }, [gameState.successCount]);

  useImperativeHandle(ref, () => ({
    resetData
  }));

  const capScore = (score) => {
    if (score >= 100) {
      return 97 + Math.floor(Math.random() * 3); // 随机生成 97, 98, 或 99
    }
    return score;
  };

  // 使用 useMemo 來優化計算結果，避免不必要的重計算
  const computedValues = useMemo(() => {
    const brainPower = capScore(calculateCoordinationAbility()); // 协调力（Coordination Ability）
    const superPower = capScore(calculateBrainActivity()); // 脑活力（Brain Activity）
    const stability = capScore(calculateFocusAbility()); // 专注力（Focus Ability）
    const endurance = capScore(calculatePerceptionAbility()); // 感知力（Perception Ability）
    return { brainPower, superPower, stability, endurance };
  }, [gameState]);

  // 拼圖遊戲相關狀態
  const TOTAL_PIECES = 16;
  const [pieces, setPieces] = useState([]);
  const [completed, setCompleted] = useState(new Array(TOTAL_PIECES).fill(false));
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // 监控拼图完成状态
  useEffect(() => {
    if (completed.every(isComplete => isComplete)) {
      setShowCompletionModal(true);
    }
  }, [completed]);

  // 初始化拼图
  useEffect(() => {
    const initialPieces = Array.from({ length: TOTAL_PIECES }, (_, index) => ({
      id: index + 1,
      position: new Animated.ValueXY(),
      isPlaced: false,
      pan: new Animated.ValueXY(),
    }));

    // 计算安全的可视范围（考虑拼图大小）
    const PIECE_SIZE = 50;
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const safeMargin = PIECE_SIZE;
    
    // 修改可视范围，确保拼图不会超出画面
    const safeLeft = safeMargin;
    const safeRight = screenWidth - PIECE_SIZE - safeMargin;
    const safeTop = 10; // 增加上方空间
    const safeBottom = screenHeight * 0.6; // 限制在屏幕60%的高度内

    // 计算拼图底图的边界
    const GRID_SIZE = 300;
    const GRID_OFFSET_X = (screenWidth - GRID_SIZE) / 2;
    const GRID_OFFSET_Y = 50;
    const puzzleLeft = GRID_OFFSET_X;
    const puzzleRight = GRID_OFFSET_X + GRID_SIZE;
    const puzzleTop = GRID_OFFSET_Y;
    const puzzleBottom = GRID_OFFSET_Y + GRID_SIZE;

    // 将拼图均匀分布在四周
    initialPieces.forEach((piece, index) => {
      const piecesPerSide = Math.ceil(TOTAL_PIECES / 4);
      const sideIndex = Math.floor(index / piecesPerSide);
      
      let x, y;
      const spreadRange = PIECE_SIZE * 0.8; // 散布范围
      
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
      
      // 确保拼图在安全范围内
      x = Math.max(safeLeft, Math.min(safeRight, x));
      y = Math.max(safeTop, Math.min(safeBottom, y));
      
      // 加入小幅度的随机偏移
      x += (Math.random() - 0.5) * PIECE_SIZE * 0.3;
      y += (Math.random() - 0.5) * PIECE_SIZE * 0.3;
      
      piece.position.setValue({ x, y });
    });

    setPieces(initialPieces);
  }, []);

  // 使用 useMemo 來優化 pieces 的計算，避免不必要的重計算
  const memoizedPieces = useMemo(() => {
    // 只在 pieces 變化時才重新計算，避免不必要的重新創建
    return pieces;
  }, [pieces]);

  // 使用 useCallback 來優化 handlePiecePress 函數，避免不必要的重渲染
  const memoizedHandlePiecePress = useCallback((index) => {
    // 處理拼圖按下事件的邏輯
    console.log(`Piece ${index} pressed`);
  }, []);

  const handleAutoComplete = useCallback(() => {
    const correctPositions = {
      1:  { x:  45,  y:  80 },  // 橙色十字
      2:  { x: 115,  y:  80 },  // 蓝色圆形
      3:  { x: 185,  y:  80 },  // 紫色三角
      4:  { x: 245,  y:  80 },  // 绿色半圆
      5:  { x:  45,  y: 155 },  // 粉红色星星
      6:  { x: 115,  y: 155 },  // 橙色椭圆
      7:  { x: 180,  y: 155 },  // 黄色五边形
      8:  { x: 245,  y: 155 },  // 浅蓝色方形
      9:  { x:  45,  y: 215 },  // 绿色梯形
      10: { x: 110,  y: 220 },  // 红色六角
      11: { x: 175,  y: 215 },  // 蓝色梅花
      12: { x: 245,  y: 215 },  // 绿色爱心
      13: { x:  45,  y: 285 },  // 黄色箭头屋
      14: { x: 105,  y: 285 },  // 紫色X星
      15: { x: 175,  y: 285 },  // 粉色方块
      16: { x: 245,  y: 285 },  // 红色平行四边形
    };
    
    const newPieces = [...pieces];
    newPieces.forEach(piece => {
      const correctPos = correctPositions[piece.id];
      piece.position.setValue({ x: correctPos.x, y: correctPos.y });
      piece.pan.setValue({ x: 0, y: 0 });
    });
    setPieces(newPieces);
    setCompleted(new Array(TOTAL_PIECES).fill(true));
  }, [pieces]);

  // 初始化計時器
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeCounter(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

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
        {/* End game button */}
        <View style={styles.pizzleGameZone}>
          <PuzzleTest
            gameData={gameData}
            completed={completed}
            handleAutoComplete={handleAutoComplete}
            handlePiecePress={memoizedHandlePiecePress}
            pieces={memoizedPieces}
            navigation={navigation}
          />
        </View>
        {/* Bottom navigation */}
        <View style={[styles.footer, { position: 'absolute', bottom: 10, width: '100%' }]}>
          <TouchableOpacity 
            style={styles.footerButton}
            onPress={() => navigation.navigate('Home')}>
            <ImageBackground
              source={require('../assets/img/btn.png')}
              style={styles.buttonBackground}
              resizeMode="stretch"
            >
              <Text style={styles.footerButtonText}>回首页</Text>
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
              <Text style={styles.footerButtonText}>历史记录</Text>
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
            <Text style={styles.completionText}>恭喜完成拼图！</Text>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => {
                handleEndGame();
                setShowCompletionModal(false);
              }}>
              <Text style={styles.reportButtonText}>查看报告</Text>
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
    paddingVertical: 5,
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
    color: '#4CAF50',  // 绿色
  },
  failureIcon: {
    color: '#f44336',  // 红色
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
