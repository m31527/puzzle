import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path, Line, G, Circle, Rect } from 'react-native-svg';
import { getLevel } from './utils/reportUtils';
import { useLanguage } from './i18n/LanguageContext';

const PreviewReport = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage(); // 使用語言上下文
  // 确保从不同来源进入时都能正确获取数据
  const [reportData, setReportData] = useState(null);
  // 從路由參數獲取報告數據，如果沒有則使用默認值
  useEffect(() => {
      console.log('Report received params:', route.params);
      
      // 检查数据来源并设置数据
      if (route.params) {
        if (route.params.gameData) {
          // 来自游戏结束
          // console.log('Data from game end:', route.params.gameData);
          setReportData(route.params.gameData);
        } else if (route.params.historyData) {
          // 来自历史记录
          // console.log('Data from history:', route.params.historyData);
          setReportData(route.params.historyData);
        }
      }
    }, [route.params]);
  const gameData = reportData; // 為了兼容現有代碼，將 reportData 賦值給 gameData
  
  // 解構遊戲數據
  const {
    brainPower = 65, // 協調力
    superPower = 65, // 腦活力
    stability = 65,  // 專注力
    endurance = 70,  // 感知力
    completionTime = 120, // 完成時間（秒）
  } = gameData;
  
  // 獲取各能力的等級
  const coordinationLevel = getLevel(brainPower);
  const brainActivityLevel = getLevel(superPower);
  const focusLevel = getLevel(stability);
  const perceptionLevel = getLevel(endurance);
  
  // 螢幕寬度
  const windowWidth = Dimensions.get('window').width;
  
  // 繪製腦電波趨勢圖
  const renderBrainwaveChart = () => {
    // 圖表尺寸和邊距
    const chartWidth = windowWidth - 40;
    const chartHeight = 200;
    const padding = 10;
    
    // 生成模擬的腦電波數據
    const generateData = (length, baseline, variance) => {
      return Array.from({ length }, () => baseline + (Math.random() * 2 - 1) * variance);
    };
    
    // 模擬注意力和冥想數據
    const attentionData = generateData(20, 60, 20);
    const meditationData = generateData(20, 50, 15);
    
    // 計算路徑
    const getPath = (data, color) => {
      const xStep = (chartWidth - padding * 2) / (data.length - 1);
      const yScale = (chartHeight - padding * 2) / 100;
      
      let path = '';
      data.forEach((value, index) => {
        const x = padding + index * xStep;
        const y = chartHeight - padding - (value * yScale);
        if (index === 0) {
          path += `M ${x} ${y}`;
        } else {
          path += ` L ${x} ${y}`;
        }
      });
      
      return (
        <Path
          d={path}
          stroke={color}
          strokeWidth={2}
          fill="none"
        />
      );
    };
    
    // 繪製網格線
    const renderGridLines = () => {
      const horizontalLines = [];
      const verticalLines = [];
      const numHLines = 5;
      const numVLines = 10;
      
      // 水平線
      for (let i = 0; i <= numHLines; i++) {
        const y = padding + (i * (chartHeight - padding * 2) / numHLines);
        horizontalLines.push(
          <Line
            key={`h-${i}`}
            x1={padding}
            y1={y}
            x2={chartWidth - padding}
            y2={y}
            stroke="#DDDDDD"
            strokeWidth={0.5}
          />
        );
      }
      
      // 垂直線
      for (let i = 0; i <= numVLines; i++) {
        const x = padding + (i * (chartWidth - padding * 2) / numVLines);
        verticalLines.push(
          <Line
            key={`v-${i}`}
            x1={x}
            y1={padding}
            x2={x}
            y2={chartHeight - padding}
            stroke="#DDDDDD"
            strokeWidth={0.5}
          />
        );
      }
      
      return [...horizontalLines, ...verticalLines];
    };
    
    // X軸標籤
    const renderXLabels = () => {
      const labels = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      return labels.map((label, index) => {
        const x = padding + (index * (chartWidth - padding * 2) / 10);
        return (
          <Text
            key={`x-${index}`}
            style={[
              styles.chartLabel,
              {
                position: 'absolute',
                left: x - 5,
                top: chartHeight,
                fontSize: 10,
                color: '#666',
              }
            ]}
          >
            {label}
          </Text>
        );
      });
    };
    
    return (
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {renderGridLines()}
          {getPath(attentionData, '#1E90FF')} {/* 藍色線表示注意力 */}
          {getPath(meditationData, '#FF6347')} {/* 紅色線表示冥想 */}
        </Svg>
        {renderXLabels()}
      </View>
    );
  };
  
  // 渲染能力評估圓形
  const renderAbilityCircle = (level, title, description) => {
    return (
      <View style={styles.abilityContainer}>
        <View style={styles.levelCircle}>
          <Text style={styles.levelText}>{level}級</Text>
        </View>
        <View style={styles.abilityTextContainer}>
          <Text style={styles.abilityTitle}>{title}</Text>
          <Text style={styles.abilityDescription}>{description}</Text>
        </View>
      </View>
    );
  };
  
  // 返回主頁
  const goToHome = () => {
    navigation.navigate('Home');
  };
  
  // 查看詳細報告
  const viewDetailReport = () => {
    navigation.navigate('Report', { gameData });
  };
  
  return (
    <ImageBackground
      source={require('../assets/img/background.png')}
      style={styles.background}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('previewReportTitle')}</Text>
          <View style={styles.timeContainer}>
            <Text style={styles.timeLabel}>{t('completionTime')}</Text>
            <Text style={styles.timeValue}>{completionTime}</Text>
            <Text style={styles.timeUnit}>{t('seconds')}</Text>
          </View>
        </View>
        
        {/* 腦電波趨勢圖 */}
        {renderBrainwaveChart()}
        
        {/* 能力評估 */}
        <View style={styles.abilitiesContainer}>
          {renderAbilityCircle(
            coordinationLevel,
            t('coordination'),
            t('coordinationDesc')
          )}
          
          {renderAbilityCircle(
            brainActivityLevel,
            t('brainActivity'),
            t('brainActivityDesc')
          )}
          
          {renderAbilityCircle(
            focusLevel,
            t('focusAbility'),
            t('focusAbilityDesc')
          )}
          
          {renderAbilityCircle(
            perceptionLevel,
            t('perception'),
            t('perceptionDesc')
          )}
        </View>
        
        {/* 按鈕區域 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={viewDetailReport}>
            <Text style={styles.buttonText}>{t('viewDetailReport')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={goToHome}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>{t('returnToHome')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFF0F5', // 淺粉紅色背景
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 15,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 5,
  },
  timeLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 10,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  timeUnit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 5,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginVertical: 20,
    height: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartLabel: {
    color: '#666',
    fontSize: 10,
  },
  abilitiesContainer: {
    marginVertical: 20,
  },
  abilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#BFA73E', // 金色圓圈
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  levelText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  abilityTextContainer: {
    flex: 1,
  },
  abilityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  abilityDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  secondaryButtonText: {
    color: '#4A90E2',
  },
});

export default PreviewReport;
