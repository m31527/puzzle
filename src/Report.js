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
  Linking,
  Image
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
  
  // 确保从不同来源进入时都能正确获取数据
  const [reportData, setReportData] = useState(null);

  // 使用 useEffect 来处理页面焦点变化
  useEffect(() => {
    if (isFocused) {
      console.log('Report 页面获得焦点，暂停背景处理');
      pauseProcessing();
    }
    
    return () => {
      if (!isFocused) {
        console.log('Report 页面失去焦点，恢复背景处理');
        resumeProcessing();
      }
    };
  }, [isFocused]);

  useEffect(() => {
    //console.log('Report received params:', route.params);
    
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

  // 如果还没有数据，显示加载中
  if (!reportData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  // 从 reportData 中解构数据
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

  const userName = '受试者';

  // 使用从游戏传来的分数
  const finalScore = score;  

  // 计算群众百分比位置
  const calculatePercentile = () => {
    let cumulativePercentage = 0;
    for (let i = 0; i < successCount; i++) {
      cumulativePercentage += GAME_CONFIG.HIT_DISTRIBUTION[i] || 0;
    }
    return Math.round(cumulativePercentage);
  };

  const percentilePosition = calculatePercentile();

  // 圈形图表的参数

  // 圆形图表的参数
  const windowWidth = Dimensions.get('window').width;
  const centerX = windowWidth / 2;
  const radius = windowWidth * 0.35;  // 增加图表大小
  const strokeWidth = 1;

  // 绘制同心圆和刻度的函数
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

  // 绘制轴线的函数
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

  // 绘制数据区域
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
          fill="rgba(248, 89, 89, 0.3)"
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

  // 显示脑活力报告
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
  
  // 显示专注力报告
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
  
  // 显示感知力报告
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

  // 生成 PDF 并打开查看
  const handleDownload = async (htmlContent, fileName) => {
    try {
      console.log('开始生成 PDF...');
      
      // 生成 PDF 文件
      const options = {
        html: htmlContent,
        fileName: fileName || `脑电波报告_${new Date().getTime()}`,
        directory: 'Documents',
        orientation: 'landscape', // Ensure A4 landscape
        pageSize: 'A4', // Ensure it's A4
      };
      console.log('---RNHTMLtoPDF:', RNHTMLtoPDF);
      const file = await RNHTMLtoPDF.convert(options);
      console.log('生成的PDF文件路径:', file.filePath);
      
      // 导航到 PDFView 页面查看 PDF
      navigation.navigate('PDFView', { pdfPath: file.filePath });
      
      // 显示成功提示
      if (Platform.OS === 'android') {
        ToastAndroid.show('报告生成成功', ToastAndroid.SHORT);
      }
      
      return file.filePath;
    } catch (error) {
      console.error('生成PDF时发生错误:', error);
      Alert.alert('错误', `生成PDF时发生错误: ${error.message || error}`);
      return null;
    }
  };

  return (
    <ImageBackground
      source={require('../assets/img/background.png')}
      style={styles.background}
    >
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>拼图游戏</Text>
      </View>
      
      <View style={styles.contentContainer}>
        {renderAbilityChart()}
        
        <Text style={styles.nameText}>姓名：{userName} , 完成时间：{completionTime} 秒</Text>
         {/* 右上角查看报告按钮 - 使用更明显的按钮样式 */}
         <TouchableOpacity
          style={{
            borderColor: '#FFC0CB', // Pink border
            borderWidth: 2,
            padding: 10,
            borderRadius: 5,
            width: '80%', // Make the button longer
            alignItems: 'center',
            marginVertical: 10,
            alignSelf: 'center',
            backgroundColor: '#FFFFFF',
          }}
          onPress={async () => {
            console.log('点击了报告按钮');
            
            try {
              // 显示变化提示
              Alert.alert('提示', '正在生成报告...');
              
              // 获取各项能力的评估级别
              const coordinationLevel = getLevel(brainPower);
              const brainActivityLevel = getLevel(superPower);
              const focusLevel = getLevel(stability);
              const perceptionLevel = getLevel(endurance);
              
              // 获取各项能力的评估详情
              const coordinationAssessment = getCoordinationAssessment(coordinationLevel);
              const brainActivityAssessment = getBrainActivityAssessment(brainActivityLevel);
              const focusAssessment = getFocusAbilityAssessment(focusLevel);
              const perceptionAssessment = getPerceptionAbilityAssessment(perceptionLevel);
              
              // 创建 HTML 报告内容
              const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <title>脑电波分析报告</title>
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
                  <h1>脑电波指标等级评估报告</h1>
                  
                  <div class="info">
                    <p><strong>姓名：</strong>${userName}</p>
                    <p><strong>完成时间：</strong>${completionTime} 秒</p>
                    <p><strong>报告生成时间：</strong>${new Date().toLocaleString()}</p>
                  </div>
                  
                  <h2>★ 协调力：<span class="level">${coordinationLevel}级 - ${coordinationAssessment.title}</span></h2>
                  <p>${coordinationAssessment.description}</p>
                  
                  <p><strong>表现特征：</strong></p>
                  <ul class="features">
                    ${coordinationAssessment.features.map(feature => `<li class="feature-item">${feature}</li>`).join('')}
                  </ul>
                  
                  <p><strong>建议：</strong></p>
                  <ul class="suggestions">
                    ${coordinationAssessment.suggestions.map(suggestion => `<li class="suggestion-item">${suggestion}</li>`).join('')}
                  </ul>
                  
                  <h2>★ 脑活力：<span class="level">${brainActivityLevel}级 - ${brainActivityAssessment.title}</span></h2>
                  <p>${brainActivityAssessment.description}</p>
                  
                  <p><strong>表现特征：</strong></p>
                  <ul class="features">
                    ${brainActivityAssessment.features.map(feature => `<li class="feature-item">${feature}</li>`).join('')}
                  </ul>
                  
                  <p><strong>建议：</strong></p>
                  <ul class="suggestions">
                    ${brainActivityAssessment.suggestions.map(suggestion => `<li class="suggestion-item">${suggestion}</li>`).join('')}
                  </ul>
                  
                  <h2>★ 专注力：<span class="level">${focusLevel}级 - ${focusAssessment.title}</span></h2>
                  <p>${focusAssessment.description}</p>
                  
                  <p><strong>表现特征：</strong></p>
                  <ul class="features">
                    ${focusAssessment.features.map(feature => `<li class="feature-item">${feature}</li>`).join('')}
                  </ul>
                  
                  <p><strong>建议：</strong></p>
                  <ul class="suggestions">
                    ${focusAssessment.suggestions.map(suggestion => `<li class="suggestion-item">${suggestion}</li>`).join('')}
                  </ul>
                  
                  <h2>★ 感知力：<span class="level">${perceptionLevel}级 - ${perceptionAssessment.title}</span></h2>
                  <p>${perceptionAssessment.description}</p>
                  
                  <p><strong>表现特征：</strong></p>
                  <ul class="features">
                    ${perceptionAssessment.features.map(feature => `<li class="feature-item">${feature}</li>`).join('')}
                  </ul>
                  
                  <p><strong>建议：</strong></p>
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
                // 使用 handleDownload 函数生成 PDF
                const fileName = `脑电波报告_${userName}_${new Date().getTime()}`;
                await handleDownload(htmlContent, fileName);
              } catch (error) {
                console.log('RNHTMLtoPDF 不可用，使用备用方案...', error);
                // 备用方案：显示报告内容
                Alert.alert(
                  '脑电波评估报告',
                  `姓名：${userName}\n完成时间：${completionTime} 秒\n\n协调力: ${coordinationAssessment.title}\n脑活力: ${brainActivityAssessment.title}\n专注力: ${focusAssessment.title}\n感知力: ${perceptionAssessment.title}`,
                  [
                    { 
                      text: '复制报告', 
                      onPress: () => {
                        const reportText = `脑电波评估报告\n\n姓名：${userName}\n完成时间：${completionTime} 秒\n\n协调力: ${coordinationAssessment.title}\n${coordinationAssessment.description}\n\n脑活力: ${brainActivityAssessment.title}\n${brainActivityAssessment.description}\n\n专注力: ${focusAssessment.title}\n${focusAssessment.description}\n\n感知力: ${perceptionAssessment.title}\n${perceptionAssessment.description}`;
                        Clipboard.setString(reportText);
                        if (Platform.OS === 'android') {
                          ToastAndroid.show('报告已复制到剪贴板', ToastAndroid.SHORT);
                        } else {
                          Alert.alert('成功', '报告已复制到剪贴板');
                        }
                      } 
                    },
                    { 
                      text: '关闭', 
                      style: 'cancel' 
                    }
                  ]
                );
              }
              
            } catch (error) {
              console.error('生成PDF报告时发生错误:', error);
              
              // 如果 PDF 生成失败，则显示简化报告
              Alert.alert(
                '脑电波评估报告', 
                `姓名：${userName}\n完成时间：${completionTime} 秒\n\n协调力: ${coordinationAssessment.title}\n脑活力: ${brainActivityAssessment.title}\n专注力: ${focusAssessment.title}\n感知力: ${perceptionAssessment.title}`,
                [{ text: 'OK', style: 'default' }]
              );
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: '#FFC0CB', fontWeight: 'bold', fontSize: 16 }}>查看报告</Text>
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
            <Text style={styles.buttonText}>回首页</Text>
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
    paddingBottom:20,
    width: '100%',
  },
  statsBox: {
    width: '40%',
    margin: '2%',
    padding: 5,
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