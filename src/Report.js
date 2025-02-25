import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import Svg, { Circle, Line, Text as SvgText, Path, G } from 'react-native-svg';
import { GAME_CONFIG } from './config/gameConfig';
import { useAppState } from './context/AppStateContext';

const Report = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { pauseProcessing, resumeProcessing } = useAppState();
  const isFocused = useIsFocused();
  
  // 確保從不同來源進入時都能正確獲取數據
  const [reportData, setReportData] = useState(null);
  
  // 使用 useEffect 來處理頁面焦點變化
  useEffect(() => {
    if (isFocused) {
      console.log('Report 頁面獲得焦點，暫停背景處理');
      pauseProcessing();
    }
    
    return () => {
      if (!isFocused) {
        console.log('Report 頁面失去焦點，恢復背景處理');
        resumeProcessing();
      }
    };
  }, [isFocused]);

  useEffect(() => {
    //console.log('Report received params:', route.params);
    
    // 檢查數據來源並設置數據
    if (route.params) {
      if (route.params.gameData) {
        // 來自遊戲結束
        // console.log('Data from game end:', route.params.gameData);
        setReportData(route.params.gameData);
      } else if (route.params.historyData) {
        // 來自歷史記錄
        // console.log('Data from history:', route.params.historyData);
        setReportData(route.params.historyData);
      }
    }
  }, [route.params]);

  // 如果還沒有數據，顯示載入中
  if (!reportData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }

  // 從 reportData 中解構數據
  const {
    superPower = 0,
    brainPower = 0,
    stability = 0,
    endurance = 0,
    successCount = 0,
    throwCount = 0,
    score = 0,
  } = reportData;

  const userName = '受試者';

  // 使用從遊戲傳來的分數
  const finalScore = score;  

  // 計算群眾百分比位置
  const calculatePercentile = () => {
    let cumulativePercentage = 0;
    for (let i = 0; i < successCount; i++) {
      cumulativePercentage += GAME_CONFIG.HIT_DISTRIBUTION[i] || 0;
    }
    return Math.round(cumulativePercentage);
  };

  const percentilePosition = calculatePercentile();

  // 圓形圖表的參數
  const windowWidth = Dimensions.get('window').width;
  const centerX = windowWidth / 2;
  const radius = windowWidth * 0.35;  // 增加圖表大小
  const strokeWidth = 1;

  // 繪製同心圓和刻度的函數
  const renderCirclesAndScales = () => {
    const circles = [];
    const numCircles = 5;
    const scaleLabels = ['0', '20', '40', '60', '80', '100'];
    
    for (let i = 0; i <= numCircles; i++) {
      const currentRadius = (radius * i) / numCircles;
      circles.push(
        <G key={`circle-group-${i}`}>
          <Circle
            cx={centerX}
            cy={radius + 100}
            r={currentRadius}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <SvgText
            x={centerX - 15}
            y={radius + 100 - currentRadius}
            fill="rgba(255, 255, 255, 0.6)"
            fontSize="10"
          >
            {scaleLabels[i]}
          </SvgText>
        </G>
      );
    }
    return circles;
  };

  // 繪製軸線的函數
  const renderAxes = () => {
    const axes = [];
    const numAxes = 4;
    const angleStep = (2 * Math.PI) / numAxes;
    const labels = ['超能力', '腦力', '維持度', '穩定度'];
    const labelOffset = 25;

    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const endX = centerX + Math.cos(angle) * radius;
      const endY = (radius + 100) + Math.sin(angle) * radius;
      const labelX = centerX + Math.cos(angle) * (radius + labelOffset);
      const labelY = (radius + 100) + Math.sin(angle) * (radius + labelOffset);

      axes.push(
        <G key={`axis-group-${i}`}>
          <Line
            x1={centerX}
            y1={radius + 100}
            x2={endX}
            y2={endY}
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth={1}
          />
          <SvgText
            x={labelX}
            y={labelY}
            fill="#FFFFFF"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {labels[i]}
          </SvgText>
        </G>
      );
    }
    return axes;
  };

  // 繪製數據區域
  const renderDataArea = () => {
    const values = [superPower, brainPower, stability, endurance];
    const numPoints = 4;
    const angleStep = (2 * Math.PI) / numPoints;
    let pathD = '';

    values.forEach((value, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const distance = (value / 100) * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = (radius + 100) + Math.sin(angle) * distance;
      
      if (i === 0) {
        pathD += `M ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
      }
    });
    pathD += ' Z';

    return (
      <G>
        <Path
          d={pathD}
          fill="rgba(255, 255, 255, 0.3)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={2}
        />
        {values.map((value, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const distance = (value / 100) * radius;
          const x = centerX + Math.cos(angle) * distance;
          const y = (radius + 100) + Math.sin(angle) * distance;
          
          return (
            <G key={`point-group-${i}`}>
              <Circle
                cx={x}
                cy={y}
                r={4}
                fill="#FFFFFF"
              />
              <SvgText
                x={x}
                y={y - 10}
                fill="#FFFFFF"
                fontSize="12"
                textAnchor="middle"
              >
                {Math.round(value)}
              </SvgText>
            </G>
          );
        })}
      </G>
    );
  };

  const renderAbilityChart = () => {
    return (
      <Svg width={windowWidth} height={windowWidth+20}>
        {renderCirclesAndScales()}
        {renderAxes()}
        {renderDataArea()}
      </Svg>
    );
  };

  const goBack = () => {
    navigation.navigate('History');
  };

  const playAgain = () => {
    navigation.navigate('Evaluate');
  };

  return (
    <ImageBackground
      source={require('../assets/img/background.png')}
      style={styles.background}
    >
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>意念投壺</Text>
      </View>
      
      <View style={styles.contentContainer}>
        {renderAbilityChart()}
        
        <Text style={styles.nameText}>姓名：{userName}</Text>
        
        <View style={styles.statsContainer}>
          <View style={[styles.statsBox, styles.throwsBox]}>
            <Text style={styles.statsLabel}>投出次數</Text>
            <Text style={styles.statsValue}>{throwCount}/{GAME_CONFIG.MAX_THROWS}</Text>
          </View>
          <View style={[styles.statsBox, styles.successBox]}>
            <Text style={styles.statsLabel}>投中</Text>
            <Text style={styles.statsValue}>{successCount}</Text>
          </View>
          <View style={[styles.statsBox, styles.scoreBox]}>
            <Text style={styles.statsLabel}>綜合分數</Text>
            <Text style={styles.statsValue}>{finalScore}</Text>
          </View>
          <View style={[styles.statsBox, styles.percentileBox]}>
            <Text style={styles.statsLabel}>群眾比例</Text>
            <Text style={styles.statsValue}>{100 - percentilePosition}%</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Home')}
        >
          <ImageBackground
            source={require('../assets/img/btn.png')}
            style={styles.buttonBackground}
            resizeMode="stretch"
          >
            <Text style={styles.buttonText}>回首頁</Text>
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={playAgain}
        >
          <ImageBackground
            source={require('../assets/img/btn.png')}
            style={styles.buttonBackground}
            resizeMode="stretch"
          >
            <Text style={styles.buttonText}>再玩一次</Text>
          </ImageBackground>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#D2B48C',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  titleText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', 
    flex: 1,
    alignItems: 'center',
  },
  nameText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  statsBox: {
    width: '40%',
    margin: '2%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  throwsBox: {
    backgroundColor: '#8BA07E',
  },
  successBox: {
    backgroundColor: '#8BA07E',
  },
  scoreBox: {
    backgroundColor: '#7B92AA',
  },
  percentileBox: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',  // 金色背景
  },
  statsLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 5,
  },
  statsValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  button: {
    width: '45%',
  },
  buttonBackground: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
});

export default Report;