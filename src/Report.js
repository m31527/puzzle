import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  ToastAndroid,
  Clipboard,
  Linking
} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import Svg, { Circle, Line, Text as SvgText, Path, G } from 'react-native-svg';
import { GAME_CONFIG } from './config/gameConfig';
import { useAppState } from './context/AppStateContext';
import { getLevel, getCoordinationAssessment, getBrainActivityAssessment, getFocusAbilityAssessment, getPerceptionAbilityAssessment } from './utils/reportUtils';

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
    completionTime = 0,
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

  // 圈形圖表的參數

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
    const labels = ['协调力', '脑活力', '专注力', '感知力'];
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
            fill="#000000"
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
          fill="rgba(248, 196, 196, 0.3)"
          stroke="rgba(251, 142, 142, 0.2)"
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
                fill="#000000"
              />
              <SvgText
                x={x}
                y={y - 10}
                fill="#000000"
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

  // 顯示詳細報告
  const showDetailedReport = () => {
    console.log('點擊了報告按鈕');
    
    // 简单测试Alert是否正常工作
    Alert.alert(
      '测试提示', 
      '测试Alert组件是否正常工作',
      [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
    );
    
    try {
      console.log('开始获取级别信息');
      // 獲取各項能力的評估級別
      const coordinationLevel = getLevel(brainPower);
      const brainActivityLevel = getLevel(superPower);
      const focusLevel = getLevel(stability);
      const perceptionLevel = getLevel(endurance);
      
      console.log('获取级别成功:', { coordinationLevel, brainActivityLevel, focusLevel, perceptionLevel });
      
      // 獲取協調力評估詳情
      console.log('开始获取评估详情');
      const coordinationAssessment = getCoordinationAssessment(coordinationLevel);
      console.log('获取协调力评估成功');
      
      // 顯示協調力評估報告
      console.log('尝试显示 Alert');
      Alert.alert(
        `協調力: ${coordinationLevel}级 - ${coordinationAssessment.title}`,
        `${coordinationAssessment.description}\n\n表现特征:\n${coordinationAssessment.features.map(feature => `• ${feature}`).join('\n')}\n\n建议:\n${coordinationAssessment.suggestions.map(suggestion => `• ${suggestion}`).join('\n')}`,
        [
          { 
            text: '查看脑活力', 
            onPress: () => showBrainActivityReport(brainActivityLevel) 
          },
          { 
            text: '关闭', 
            style: 'cancel' 
          }
        ]
      );
    } catch (error) {
      console.error('顯示報告時發生錯誤:', error);
      Alert.alert('錯誤', `顯示報告時發生錯誤: ${error.message || error}`);
    }
  };
  
  // 顯示腦活力報告
  const showBrainActivityReport = (level) => {
    const assessment = getBrainActivityAssessment(level);
    Alert.alert(
      `脑活力: ${level}级 - ${assessment.title}`,
      assessment.description,
      [
        { 
          text: '查看专注力', 
          onPress: () => showFocusReport(getLevel(stability)) 
        },
        { 
          text: '关闭', 
          style: 'cancel' 
        }
      ]
    );
  };
  
  // 顯示專注力報告
  const showFocusReport = (level) => {
    const assessment = getFocusAbilityAssessment(level);
    Alert.alert(
      `专注力: ${level}级 - ${assessment.title}`,
      assessment.description,
      [
        { 
          text: '查看感知力', 
          onPress: () => showPerceptionReport(getLevel(endurance)) 
        },
        { 
          text: '关闭', 
          style: 'cancel' 
        }
      ]
    );
  };
  
  // 顯示感知力報告
  const showPerceptionReport = (level) => {
    const assessment = getPerceptionAbilityAssessment(level);
    Alert.alert(
      `感知力: ${level}级 - ${assessment.title}`,
      assessment.description,
      [
        { 
          text: '完成', 
          style: 'default' 
        }
      ]
    );
  };

  // 生成 PDF 並打開查看
  const handleDownload = async (htmlContent, fileName) => {
    try {
      console.log('開始生成 PDF...');
      
      // 生成 PDF 文件
      const options = {
        html: htmlContent,
        fileName: fileName || `腦電波報告_${new Date().getTime()}`,
        directory: 'Documents',
        orientation: 'landscape', // Ensure A4 landscape
        pageSize: 'A4', // Ensure it's A4
      };
      console.log('---RNHTMLtoPDF:', RNHTMLtoPDF);
      const file = await RNHTMLtoPDF.convert(options);
      console.log('生成的PDF文件路徑:', file.filePath);
      
      // 導航到 PDFView 頁面查看 PDF
      navigation.navigate('PDFView', { pdfPath: file.filePath });
      
      // 顯示成功提示
      if (Platform.OS === 'android') {
        ToastAndroid.show('報告生成成功', ToastAndroid.SHORT);
      }
      
      return file.filePath;
    } catch (error) {
      console.error('生成PDF時發生錯誤:', error);
      Alert.alert('錯誤', `生成PDF時發生錯誤: ${error.message || error}`);
      return null;
    }
  };

  return (
    <ImageBackground
      source={require('../assets/img/background.png')}
      style={styles.background}
    >
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>拼圖遊戲</Text>
      </View>
      
      <View style={styles.contentContainer}>
        {renderAbilityChart()}
        
        <Text style={styles.nameText}>姓名：{userName} , 完成時間：{completionTime} 秒</Text>
         {/* 右上角查看報告按鈕 - 使用更明顯的按鈕樣式 */}
         <TouchableOpacity 
          style={{
            backgroundColor: '#4CAF50',
            padding: 10,
            borderRadius: 5,
            marginRight: 10,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }} 
          onPress={async () => {
            console.log('點擊了報告按鈕');
            
            try {
              // 顯示變化提示
              Alert.alert('提示', '正在生成報告...');
              
              // 獲取各項能力的評估級別
              const coordinationLevel = getLevel(brainPower);
              const brainActivityLevel = getLevel(superPower);
              const focusLevel = getLevel(stability);
              const perceptionLevel = getLevel(endurance);
              
              // 獲取各項能力的評估詳情
              const coordinationAssessment = getCoordinationAssessment(coordinationLevel);
              const brainActivityAssessment = getBrainActivityAssessment(brainActivityLevel);
              const focusAssessment = getFocusAbilityAssessment(focusLevel);
              const perceptionAssessment = getPerceptionAbilityAssessment(perceptionLevel);
              
              // 創建 HTML 報告內容
              const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <title>脑電波分析報告</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #4CAF50; text-align: center; }
                    h2 { color: #2196F3; margin-top: 20px; }
                    .info { background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
                    .level { font-weight: bold; color: #FF5722; }
                    .features { margin-left: 20px; }
                    .suggestions { margin-left: 20px; }
                    .feature-item, .suggestion-item { margin-bottom: 5px; }
                  </style>
                </head>
                <body>
                  <h1>脑電波指標等級評估報告</h1>
                  
                  <div class="info">
                    <p><strong>姓名：</strong>${userName}</p>
                    <p><strong>完成時間：</strong>${completionTime} 秒</p>
                    <p><strong>報告生成時間：</strong>${new Date().toLocaleString()}</p>
                  </div>
                  
                  <h2>★ 協調力：<span class="level">${coordinationLevel}級 - ${coordinationAssessment.title}</span></h2>
                  <p>${coordinationAssessment.description}</p>
                  
                  <p><strong>表现特征：</strong></p>
                  <ul class="features">
                    ${coordinationAssessment.features.map(feature => `<li class="feature-item">${feature}</li>`).join('')}
                  </ul>
                  
                  <p><strong>建議：</strong></p>
                  <ul class="suggestions">
                    ${coordinationAssessment.suggestions.map(suggestion => `<li class="suggestion-item">${suggestion}</li>`).join('')}
                  </ul>
                  
                  <h2>★ 腦活力：<span class="level">${brainActivityLevel}級 - ${brainActivityAssessment.title}</span></h2>
                  <p>${brainActivityAssessment.description}</p>
                  
                  <p><strong>表现特征：</strong></p>
                  <ul class="features">
                    ${brainActivityAssessment.features.map(feature => `<li class="feature-item">${feature}</li>`).join('')}
                  </ul>
                  
                  <p><strong>建議：</strong></p>
                  <ul class="suggestions">
                    ${brainActivityAssessment.suggestions.map(suggestion => `<li class="suggestion-item">${suggestion}</li>`).join('')}
                  </ul>
                  
                  <h2>★ 專注力：<span class="level">${focusLevel}級 - ${focusAssessment.title}</span></h2>
                  <p>${focusAssessment.description}</p>
                  
                  <p><strong>表现特征：</strong></p>
                  <ul class="features">
                    ${focusAssessment.features.map(feature => `<li class="feature-item">${feature}</li>`).join('')}
                  </ul>
                  
                  <p><strong>建議：</strong></p>
                  <ul class="suggestions">
                    ${focusAssessment.suggestions.map(suggestion => `<li class="suggestion-item">${suggestion}</li>`).join('')}
                  </ul>
                  
                  <h2>★ 感知力：<span class="level">${perceptionLevel}級 - ${perceptionAssessment.title}</span></h2>
                  <p>${perceptionAssessment.description}</p>
                  
                  <p><strong>表现特征：</strong></p>
                  <ul class="features">
                    ${perceptionAssessment.features.map(feature => `<li class="feature-item">${feature}</li>`).join('')}
                  </ul>
                  
                  <p><strong>建議：</strong></p>
                  <ul class="suggestions">
                    ${perceptionAssessment.suggestions.map(suggestion => `<li class="suggestion-item">${suggestion}</li>`).join('')}
                  </ul>

                  <h2>综合评估</h2>
                  <p>通过对四项指标的综合评估，我们可以了解个体的脑功能特点和潜力所在。这些指标不仅可以作为个人能力的参考，还可以指导有针对性的训练和发展计划。</p>
                  
                  <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <th>等级组合</th>
                      <th>特点描述</th>
                      <th>发展建议</th>
                    </tr>
                    <tr>
                      <td>全部为1级</td>
                      <td>脑功能处于基础发展阶段，有较大提升空间</td>
                      <td>从基础训练开始，全面提升各项能力</td>
                    </tr>
                    <tr>
                      <td>1-2级为主</td>
                      <td>脑功能发展不均衡，具备一定基础</td>
                      <td>重点提升薄弱项，适度发展优势项</td>
                    </tr>
                    <tr>
                      <td>2-3级为主</td>
                      <td>脑功能发展良好，部分领域表现突出</td>
                      <td>平衡发展各项能力，强化特长</td>
                    </tr>
                    <tr>
                      <td>3-4级为主</td>
                      <td>脑功能发展优异，具备综合优势</td>
                      <td>挑战极限，发掘特殊才能</td>
                    </tr>
                  </table>

                  <p>每个人的脑功能特点和发展潜力各不相同，本评估报告旨在提供参考和指导，而非绝对评判。通过有针对性的训练和发展，每个人都能够提升自己的脑功能水平，发挥更大潜力。</p>
                </body>
                </html>
              `;
              
              try {
                // 使用 handleDownload 函數生成 PDF
                const fileName = `腦電波報告_${userName}_${new Date().getTime()}`;
                await handleDownload(htmlContent, fileName);
              } catch (error) {
                console.log('RNHTMLtoPDF 不可用，使用備用方案...', error);
                // 備用方案：顯示報告內容
                Alert.alert(
                  '腦電波評估報告',
                  `姓名：${userName}\n完成時間：${completionTime} 秒\n\n協調力: ${coordinationLevel}級 - ${coordinationAssessment.title}\n腦活力: ${brainActivityLevel}級 - ${brainActivityAssessment.title}\n專注力: ${focusLevel}級 - ${focusAssessment.title}\n感知力: ${perceptionLevel}級 - ${perceptionAssessment.title}`,
                  [
                    { 
                      text: '複製報告', 
                      onPress: () => {
                        const reportText = `腦電波評估報告\n\n姓名：${userName}\n完成時間：${completionTime} 秒\n\n協調力: ${coordinationLevel}級 - ${coordinationAssessment.title}\n${coordinationAssessment.description}\n\n腦活力: ${brainActivityLevel}級 - ${brainActivityAssessment.title}\n${brainActivityAssessment.description}\n\n專注力: ${focusLevel}級 - ${focusAssessment.title}\n${focusAssessment.description}\n\n感知力: ${perceptionLevel}級 - ${perceptionAssessment.title}\n${perceptionAssessment.description}`;
                        Clipboard.setString(reportText);
                        if (Platform.OS === 'android') {
                          ToastAndroid.show('報告已複製到剪貼板', ToastAndroid.SHORT);
                        } else {
                          Alert.alert('成功', '報告已複製到剪貼板');
                        }
                      } 
                    },
                    { 
                      text: '關閉', 
                      style: 'cancel' 
                    }
                  ]
                );
              }
              
            } catch (error) {
              console.error('生成PDF報告時發生錯誤:', error);
              
              // 如果 PDF 生成失敗，則顯示簡化報告
              Alert.alert(
                '脑電波評估報告', 
                `姓名：${userName}\n完成時間：${completionTime} 秒\n\n協調力: ${coordinationLevel}級 - ${coordinationAssessment.title}\n腦活力: ${brainActivityLevel}級 - ${brainActivityAssessment.title}\n專注力: ${focusLevel}級 - ${focusAssessment.title}\n感知力: ${perceptionLevel}級 - ${perceptionAssessment.title}`,
                [{ text: 'OK', style: 'default' }]
              );
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>查看報告</Text>
        </TouchableOpacity>
        <View style={styles.statsContainer}>
          <View style={[styles.statsBox, styles.throwsBox]}>
            <Text style={styles.statsLabel}>协调力</Text>
            <Text style={styles.statsValue}>{getLevel(brainPower)}级</Text>
          </View>
          <View style={[styles.statsBox, styles.successBox]}>
            <Text style={styles.statsLabel}>脑活力</Text>
            <Text style={styles.statsValue}>{getLevel(superPower)}级</Text>
          </View>
          <View style={[styles.statsBox, styles.scoreBox]}>
            <Text style={styles.statsLabel}>专注力</Text>
            <Text style={styles.statsValue}>{getLevel(stability)}级</Text>
          </View>
          <View style={[styles.statsBox, styles.percentileBox]}>
            <Text style={styles.statsLabel}>感知力</Text>
            <Text style={styles.statsValue}>{getLevel(endurance)}级</Text>
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
    position: 'relative',
  },
  titleText: {
    fontSize: 24,
    color: '#1D417D',
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
    color: '#000000',
    marginTop: 10,
  },
  downloadButton: {
    position: 'absolute',
    right: 20,
    top: 0,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadIconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(166, 142, 8, 0.78)',
    borderRadius: 15,
    padding: 5,
  },
  downloadIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    marginBottom: 2,
  },
  downloadBase: {
    width: 12,
    height: 4,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: 'rgba(166, 142, 8, 0.78)',  // 金色背景
  },
  successBox: {
    backgroundColor: 'rgba(166, 142, 8, 0.78)',  // 金色背景
  },
  scoreBox: {
    backgroundColor: 'rgba(166, 142, 8, 0.78)',  // 金色背景
  },
  percentileBox: {
    backgroundColor: 'rgba(166, 142, 8, 0.78)',  // 金色背景
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
    color: '#000000',
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